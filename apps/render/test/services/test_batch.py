"""Batch endpoint tests — POST /api/v1/videos/batch enqueues one task per
subject. task_manager.add_task is stubbed so no real render runs."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient

import app.controllers.v1.video as video_mod


class TestBatch(unittest.TestCase):
    def setUp(self):
        self.added = []
        self._orig = video_mod.task_manager.add_task
        video_mod.task_manager.add_task = lambda func, **kw: self.added.append(kw)
        from app.asgi import app

        self.client = TestClient(app)

    def tearDown(self):
        video_mod.task_manager.add_task = self._orig

    def test_batch_enqueues_one_task_per_subject(self):
        r = self.client.post(
            "/api/v1/videos/batch", json={"subjects": ["alpha", "beta", "gamma"]}
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()["data"]
        self.assertEqual(data["queued"], 3)
        self.assertEqual(data["requested"], 3)
        self.assertEqual(len(data["task_ids"]), 3)
        self.assertEqual(len(self.added), 3)
        subjects = sorted(kw["params"].video_subject for kw in self.added)
        self.assertEqual(subjects, ["alpha", "beta", "gamma"])

    def test_blank_subjects_are_skipped(self):
        r = self.client.post(
            "/api/v1/videos/batch", json={"subjects": ["only", "   ", ""]}
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["data"]["queued"], 1)

    def test_empty_batch_is_rejected(self):
        r = self.client.post("/api/v1/videos/batch", json={"subjects": []})
        self.assertNotEqual(r.status_code, 200)


if __name__ == "__main__":
    unittest.main()
