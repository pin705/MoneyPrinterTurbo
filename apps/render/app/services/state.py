import ast
import copy
import json
import os
import sqlite3
import threading
import time
from abc import ABC, abstractmethod

from app.config import config
from app.models import const

# Sentinel folder filter for "tasks not assigned to any folder".
FOLDER_UNSORTED = "__unsorted__"


def _match_task(task: dict, q: str, status, folder) -> bool:
    """Shared server-side filter for the in-memory/redis backends."""
    if status is not None:
        try:
            if int(task.get("state", -1)) != int(status):
                return False
        except (TypeError, ValueError):
            return False
    if folder is not None:
        tf = (task.get("folder") or "").strip()
        if folder == FOLDER_UNSORTED:
            if tf:
                return False
        elif tf != folder:
            return False
    if q:
        ql = q.lower()
        hay = f"{task.get('script', '')} {task.get('task_id', '')}".lower()
        if ql not in hay:
            return False
    return True


def _sort_paginate(rows: list, sort: str, page: int, page_size: int):
    rows.sort(key=lambda t: t.get("created_at") or 0, reverse=(sort != "oldest"))
    total = len(rows)
    start = (page - 1) * page_size
    return rows[start : start + page_size], total


# Base class for state management
class BaseState(ABC):
    @abstractmethod
    def update_task(self, task_id: str, state: int, progress: int = 0, **kwargs):
        pass

    @abstractmethod
    def get_task(self, task_id: str):
        pass

    @abstractmethod
    def get_all_tasks(
        self,
        page: int,
        page_size: int,
        q: str = "",
        status=None,
        sort: str = "newest",
        folder=None,
    ):
        pass

    def set_folder(self, task_id: str, folder: str | None):
        """Assign a task to a folder (label). Override per backend."""
        raise NotImplementedError

    def list_folders(self):
        """Return [{"name", "count"}] of folders in use. Override per backend."""
        return []


# Memory state management
class MemoryState(BaseState):
    def __init__(self):
        self._tasks = {}
        # Folder + created_at live outside the task record so update_task's
        # full-replace (called from the render pipeline) never wipes them.
        self._folders: dict = {}
        self._created: dict = {}
        self._lock = threading.RLock()

    def _enrich(self, task_id: str, task: dict) -> dict:
        t = copy.deepcopy(task)
        t["folder"] = self._folders.get(task_id)
        t["created_at"] = self._created.get(task_id, 0)
        return t

    def get_all_tasks(
        self,
        page: int,
        page_size: int,
        q: str = "",
        status=None,
        sort: str = "newest",
        folder=None,
    ):
        with self._lock:
            rows = [self._enrich(tid, task) for tid, task in self._tasks.items()]
        rows = [t for t in rows if _match_task(t, q, status, folder)]
        return _sort_paginate(rows, sort, page, page_size)

    def update_task(
        self,
        task_id: str,
        state: int = const.TASK_STATE_PROCESSING,
        progress: int = 0,
        **kwargs,
    ):
        progress = int(progress)
        if progress > 100:
            progress = 100

        with self._lock:
            self._created.setdefault(task_id, time.time())
            self._tasks[task_id] = {
                "task_id": task_id,
                "state": state,
                "progress": progress,
                **kwargs,
            }

    def get_task(self, task_id: str):
        with self._lock:
            task = self._tasks.get(task_id, None)
            return self._enrich(task_id, task) if task is not None else None

    def delete_task(self, task_id: str):
        with self._lock:
            self._tasks.pop(task_id, None)
            self._folders.pop(task_id, None)
            self._created.pop(task_id, None)

    def set_folder(self, task_id: str, folder: str | None):
        with self._lock:
            if folder:
                self._folders[task_id] = folder
            else:
                self._folders.pop(task_id, None)

    def list_folders(self):
        with self._lock:
            counts: dict = {}
            for f in self._folders.values():
                if f:
                    counts[f] = counts.get(f, 0) + 1
        return [{"name": k, "count": v} for k, v in sorted(counts.items())]


# Redis state management
class RedisState(BaseState):
    """
    Redis-backed task state.

    Trust boundary: Redis is expected to be private to this application. Task
    values are written by MoneyPrinterTurbo and converted back from strings for
    compatibility with existing state records. Do not expose this Redis database
    to untrusted writers without replacing deserialization with a stricter
    schema-based format.
    """

    def __init__(self, host="localhost", port=6379, db=0, password=None):
        import redis

        self._redis = redis.StrictRedis(host=host, port=port, db=db, password=password)

    def _load_all(self) -> list:
        rows = []
        cursor = 0
        while True:
            cursor, keys = self._redis.scan(cursor, count=200)
            for key in keys:
                task_data = self._redis.hgetall(key)
                if not task_data:
                    continue
                task = {
                    k.decode("utf-8"): self._convert_to_original_type(v)
                    for k, v in task_data.items()
                }
                rows.append(task)
            if cursor == 0:
                break
        return rows

    def get_all_tasks(
        self,
        page: int,
        page_size: int,
        q: str = "",
        status=None,
        sort: str = "newest",
        folder=None,
    ):
        rows = [t for t in self._load_all() if _match_task(t, q, status, folder)]
        return _sort_paginate(rows, sort, page, page_size)

    def update_task(
        self,
        task_id: str,
        state: int = const.TASK_STATE_PROCESSING,
        progress: int = 0,
        **kwargs,
    ):
        progress = int(progress)
        if progress > 100:
            progress = 100

        fields = {
            "task_id": task_id,
            "state": state,
            "progress": progress,
            **kwargs,
        }

        for field, value in fields.items():
            self._redis.hset(task_id, field, str(value))

        # Stamp created_at once; never overwrite (so sort-by-date is stable).
        # `folder` is intentionally NOT in `fields`, so a render-progress update
        # can never wipe a user's folder assignment.
        if not self._redis.hexists(task_id, "created_at"):
            self._redis.hset(task_id, "created_at", str(time.time()))

    def set_folder(self, task_id: str, folder: str | None):
        if folder:
            self._redis.hset(task_id, "folder", str(folder))
        else:
            self._redis.hdel(task_id, "folder")

    def list_folders(self):
        counts: dict = {}
        for t in self._load_all():
            f = t.get("folder")
            if f:
                counts[f] = counts.get(f, 0) + 1
        return [{"name": k, "count": v} for k, v in sorted(counts.items())]

    def get_task(self, task_id: str):
        task_data = self._redis.hgetall(task_id)
        if not task_data:
            return None

        task = {
            key.decode("utf-8"): self._convert_to_original_type(value)
            for key, value in task_data.items()
        }
        return task

    def delete_task(self, task_id: str):
        self._redis.delete(task_id)

    @staticmethod
    def _convert_to_original_type(value):
        """
        Convert values written by this application back to common Python types.

        This compatibility parser assumes Redis is inside the application's
        trust boundary. If Redis can be written by untrusted clients, task state
        should move to a strict JSON/schema parser instead of open-ended literal
        conversion.
        """
        value_str = value.decode("utf-8")

        try:
            # try to convert byte string array to list
            return ast.literal_eval(value_str)
        except (ValueError, SyntaxError):
            pass

        if value_str.isdigit():
            return int(value_str)
        # Add more conversions here if needed
        return value_str


# SQLite state management
class DbState(BaseState):
    """SQLite-backed task state — durable across process restarts.

    Built for the local desktop product: zero extra dependency (Python's stdlib
    ``sqlite3``), a single file under ``storage/``. Uses the same full-replace
    semantics as ``MemoryState`` (an ``update_task`` overwrites the whole record —
    it does not merge fields), and ``json.loads`` hands back a fresh object on
    every read, so callers get isolated snapshots for free.

    Values are JSON-coerced on write: container types are normalized (tuple/set →
    list) and any non-JSON-native value is stringified via ``default=str``. The
    only kwargs producer (``task.py``) passes JSON-native types (str/list/int/
    float/None), so today the read-back shape matches ``MemoryState`` exactly;
    callers needing strict object identity should keep passing JSON-native values.
    """

    def __init__(self, db_path: str | None = None):
        if db_path is None:
            # Lazy import avoids a module-level dependency on utils (and any
            # import cost) when SQLite state is not the selected backend.
            from app.utils import utils

            db_path = os.path.join(utils.storage_dir(create=True), "tasks.db")
        self._db_path = db_path
        self._lock = threading.RLock()
        # check_same_thread=False: the render pipeline updates progress from
        # background worker threads. Every access is serialized by self._lock,
        # so a single shared connection is safe.
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA synchronous=NORMAL")
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                task_id    TEXT PRIMARY KEY,
                state      INTEGER NOT NULL,
                progress   INTEGER NOT NULL DEFAULT 0,
                data       TEXT NOT NULL,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
            """
        )
        self._conn.commit()
        self._ensure_folder_column()

    def _ensure_folder_column(self):
        # Lightweight migration: `folder` is a dedicated column (not part of the
        # JSON `data`) so update_task's full-replace never wipes a user's folder.
        cols = [r[1] for r in self._conn.execute("PRAGMA table_info(tasks)").fetchall()]
        if "folder" not in cols:
            self._conn.execute("ALTER TABLE tasks ADD COLUMN folder TEXT")
            self._conn.commit()

    def get_all_tasks(
        self,
        page: int,
        page_size: int,
        q: str = "",
        status=None,
        sort: str = "newest",
        folder=None,
    ):
        where = []
        args: list = []
        if status is not None:
            where.append("state = ?")
            args.append(int(status))
        if folder is not None:
            if folder == FOLDER_UNSORTED:
                where.append("(folder IS NULL OR folder = '')")
            else:
                where.append("folder = ?")
                args.append(folder)
        if q:
            where.append("LOWER(data) LIKE ?")
            args.append(f"%{q.lower()}%")
        clause = ("WHERE " + " AND ".join(where)) if where else ""
        order = "ASC" if sort == "oldest" else "DESC"
        offset = (page - 1) * page_size
        with self._lock:
            total = self._conn.execute(
                f"SELECT COUNT(*) FROM tasks {clause}", args
            ).fetchone()[0]
            rows = self._conn.execute(
                f"SELECT data, created_at, folder FROM tasks {clause} "
                f"ORDER BY created_at {order}, rowid {order} LIMIT ? OFFSET ?",
                (*args, page_size, offset),
            ).fetchall()
        result = []
        for data, created_at, folder_val in rows:
            task = json.loads(data)
            task["created_at"] = created_at
            task["folder"] = folder_val
            result.append(task)
        return result, total

    def set_folder(self, task_id: str, folder: str | None):
        with self._lock:
            self._conn.execute(
                "UPDATE tasks SET folder = ? WHERE task_id = ?",
                (folder or None, task_id),
            )
            self._conn.commit()

    def list_folders(self):
        with self._lock:
            rows = self._conn.execute(
                "SELECT folder, COUNT(*) FROM tasks "
                "WHERE folder IS NOT NULL AND folder != '' GROUP BY folder ORDER BY folder"
            ).fetchall()
        return [{"name": r[0], "count": r[1]} for r in rows]

    def update_task(
        self,
        task_id: str,
        state: int = const.TASK_STATE_PROCESSING,
        progress: int = 0,
        **kwargs,
    ):
        progress = int(progress)
        if progress > 100:
            progress = 100

        record = {
            "task_id": task_id,
            "state": state,
            "progress": progress,
            **kwargs,
        }
        # default=str keeps the write resilient to any unexpected non-JSON value
        # without aborting a render (mirrors the lenient memory/redis backends).
        data = json.dumps(record, ensure_ascii=False, default=str)
        now = time.time()
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO tasks (task_id, state, progress, data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(task_id) DO UPDATE SET
                    state=excluded.state,
                    progress=excluded.progress,
                    data=excluded.data,
                    updated_at=excluded.updated_at
                """,
                (task_id, int(state), progress, data, now, now),
            )
            self._conn.commit()

    def get_task(self, task_id: str):
        with self._lock:
            row = self._conn.execute(
                "SELECT data FROM tasks WHERE task_id=?", (task_id,)
            ).fetchone()
        return json.loads(row[0]) if row else None

    def delete_task(self, task_id: str):
        with self._lock:
            self._conn.execute("DELETE FROM tasks WHERE task_id=?", (task_id,))
            self._conn.commit()


# Global state
_enable_redis = config.app.get("enable_redis", False)
_enable_sqlite = config.app.get("enable_sqlite", False)
_redis_host = config.app.get("redis_host", "localhost")
_redis_port = config.app.get("redis_port", 6379)
_redis_db = config.app.get("redis_db", 0)
_redis_password = config.app.get("redis_password", None)

# Backend precedence: Redis (shared/distributed) > SQLite (durable local) >
# Memory (ephemeral). The desktop product enables SQLite so tasks survive a
# restart; see config.example.toml.
if _enable_redis:
    state = RedisState(
        host=_redis_host, port=_redis_port, db=_redis_db, password=_redis_password
    )
elif _enable_sqlite:
    state = DbState()
else:
    state = MemoryState()
