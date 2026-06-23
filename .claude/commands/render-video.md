---
description: Render a test video end-to-end for a given topic and verify the output mp4
argument-hint: <topic, e.g. "5 thói quen buổi sáng giúp khỏe mạnh">
allowed-tools: Bash, Read
---

Render one short video for the topic: **$ARGUMENTS**

Use the `render-backend` agent's knowledge. Steps:
1. Ensure the render backend is up on :8000 (`curl .../api/v1/ping`). If not, start it:
   `MPT_HOME="$HOME/Library/Application Support/app.vidova.desktop" (cd apps/render && uv run python main.py)`.
   Confirm `config.toml` has a working `llm_provider` + key and at least one
   `*_api_keys` stock source — otherwise the render will fail.
2. POST to `/api/v1/videos` with: `video_subject=$ARGUMENTS`, `video_aspect=9:16`,
   `video_language=vi`, `voice_name=vi-VN-HoaiMyNeural-Female`, `video_source=pexels`,
   `paragraph_number=3`, `subtitle_enabled=true`. Capture the `task_id`.
3. Poll `/api/v1/tasks/{task_id}` until `videos` is populated or `state=-1` (failed).
4. Verify the output mp4 with the bundled ffmpeg (`imageio_ffmpeg.get_ffmpeg_exe()`):
   resolution should be 1080x1920, with an AAC audio stream. Extract one frame where the
   subtitle is visible and view it to confirm Vietnamese diacritics render (no tofu boxes).
5. Report the output path, duration/resolution, and the verified subtitle frame.

If TTS fails with "No audio was received", it's edge-tts throttling — wait and retry with
backoff (the pipeline already backs off). Do not declare success without inspecting the mp4.
