---
name: render-pipeline
description: Deep guide to the Vidova render pipeline in apps/render — how a topic becomes an mp4 (LLM script/terms → stock footage → Edge TTS → subtitles → ffmpeg compose), config.toml, fonts, the API, and how to render + verify a test video. Use for any change to video generation, TTS, subtitles/fonts, stock sources, or when a render fails.
---

# Render pipeline skill

The GOAT contract (must never break):
`LLM script/terms → stock footage (Pexels/Pixabay/Coverr) → Edge TTS voiceover →
subtitles → ffmpeg/moviepy compose → final-N.mp4`

## Map (`apps/render/app/services/`)
- `task.py` — orchestrator + durable task state (stdlib sqlite `DbState`); drives progress.
- `llm.py` — script + search-terms generation. Config-driven provider (`config.app["llm_provider"]`).
- `material.py` — stock footage. `get_api_key("pexels_api_keys")` etc. Provider pattern —
  add a source here, don't fork the flow.
- `voice.py` — Edge TTS. **Prefer async `stream()`** (`stream_sync()` can deadlock on some
  platforms → 30s timeout with no audio). Retry with **backoff** on throttle ("No audio was
  received" = Microsoft rate-limiting the IP). Voice name like `vi-VN-HoaiMyNeural-Female`.
- `subtitle.py` / `video.py` — burn subtitles + compose. **Font is language-aware**:
  vi → `resource/fonts/BeVietnamPro-Bold.ttf`, zh → STHeiti. CJK fonts lack Vietnamese
  precomposed glyphs (ế ữ ậ) → tofu boxes. `TaskVideoRequest.font_name` default must be
  EMPTY (`app/models/schema.py`) so the language logic runs.

## Config (`config.toml`, resolved via `MPT_HOME` in `app/config/config.py`)
- `llm_provider` + `<provider>_api_key/_base_url/_model_name`.
- `pexels_api_keys` / `pixabay_api_keys` / `coverr_api_keys` (lists). Empty → render can't
  fetch footage → fails. Keys are also settable in-app via Settings → Media.
- Desktop config path (macOS): `~/Library/Application Support/app.vidova.desktop/config.toml`.

## API (port 8000)
- `POST /api/v1/scripts` / `POST /api/v1/terms` — LLM only (good for verifying the LLM key).
- `POST /api/v1/videos` (+ `/batch`) — full render → returns `task_id`.
- `GET /api/v1/tasks/{id}` — poll `state`/`progress`/`videos`/`combined_videos`.
- `GET /api/v1/download/{path}` / `/stream/{path}`.

## Render + verify a test video
1. Start: `MPT_HOME=… (cd apps/render && uv run python main.py)`; wait for `ping → pong`.
2. POST `/api/v1/videos` (subject, `video_aspect=9:16`, `video_language=vi`, a VN voice,
   `video_source=pexels`); poll the task to completion.
3. Probe the mp4 with the bundled ffmpeg (`imageio_ffmpeg.get_ffmpeg_exe()`): expect
   1080x1920 H.264 + AAC. Extract a subtitle frame and **view it** to confirm diacritics render.

## Sidecar
`packaging/mpt-backend.spec` (SPECPATH-relative paths; `copy_metadata` for imageio/moviepy/
numpy/tqdm/decorator/proglog). Build: `pnpm build:sidecar`. onefile boots in ~50s.
