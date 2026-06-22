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


# Base class for state management
class BaseState(ABC):
    @abstractmethod
    def update_task(self, task_id: str, state: int, progress: int = 0, **kwargs):
        pass

    @abstractmethod
    def get_task(self, task_id: str):
        pass

    @abstractmethod
    def get_all_tasks(self, page: int, page_size: int):
        pass


# Memory state management
class MemoryState(BaseState):
    def __init__(self):
        self._tasks = {}
        self._lock = threading.RLock()

    def get_all_tasks(self, page: int, page_size: int):
        start = (page - 1) * page_size
        end = start + page_size
        with self._lock:
            tasks = [copy.deepcopy(task) for task in self._tasks.values()]
            total = len(tasks)
        return tasks[start:end], total

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
            self._tasks[task_id] = {
                "task_id": task_id,
                "state": state,
                "progress": progress,
                **kwargs,
            }

    def get_task(self, task_id: str):
        with self._lock:
            task = self._tasks.get(task_id, None)
            return copy.deepcopy(task) if task is not None else None

    def delete_task(self, task_id: str):
        with self._lock:
            self._tasks.pop(task_id, None)


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

    def get_all_tasks(self, page: int, page_size: int):
        start = (page - 1) * page_size
        end = start + page_size
        tasks = []
        cursor = 0
        total = 0
        while True:
            cursor, keys = self._redis.scan(cursor, count=page_size)
            batch_start = total
            batch_size = len(keys)
            total += batch_size

            # Redis SCAN 是分批返回 key。分页切片必须基于“当前批次起始索引”
            # 计算，而不能用累积后的 total 反推，否则第一页会切到空数组，
            # 第二页也可能只返回部分数据。
            if batch_start < end and total > start:
                slice_start = max(0, start - batch_start)
                slice_end = min(batch_size, end - batch_start)
                for key in keys[slice_start:slice_end]:
                    task_data = self._redis.hgetall(key)
                    task = {
                        k.decode("utf-8"): self._convert_to_original_type(v)
                        for k, v in task_data.items()
                    }
                    tasks.append(task)

            # 即使当前页已经取满，也要继续 SCAN 到 cursor=0，
            # 因为调用方需要准确 total 来渲染分页信息。
            if cursor == 0:
                break
        return tasks, total

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

    def get_all_tasks(self, page: int, page_size: int):
        offset = (page - 1) * page_size
        with self._lock:
            total = self._conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
            rows = self._conn.execute(
                # ORDER BY rowid keeps first-seen insertion order, matching
                # MemoryState (a dict preserves first-insert position on update).
                "SELECT data FROM tasks ORDER BY rowid LIMIT ? OFFSET ?",
                (page_size, offset),
            ).fetchall()
        return [json.loads(row[0]) for row in rows], total

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
