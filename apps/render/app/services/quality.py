"""Phase 0 quality gate — block "linh tinh" / broken videos before delivery.

Inspects the rendered mp4 with the bundled ffmpeg (no ffprobe dependency, so it
works inside the PyInstaller sidecar) and decides whether the output is good
enough to hand to the user. Critical issues fail the task; soft issues are
logged as warnings but still delivered.

Checks: black/blank frames, silent or missing audio, video↔audio duration
mismatch, subtitle coverage, and slideshow risk (too few distinct clips).
"""

import os
import re
import subprocess
from typing import List

from loguru import logger

from app.config import config
from app.services import subtitle as subtitle_svc
from app.utils import utils

# stderr parse patterns
_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")
_MEAN_VOL_RE = re.compile(r"mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB")
_MAX_VOL_RE = re.compile(r"max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB")
_BLACK_DUR_RE = re.compile(r"black_duration:\s*(\d+(?:\.\d+)?)")
_AUDIO_STREAM_RE = re.compile(r"Stream #\d+:\d+.*Audio:", re.IGNORECASE)
# One SRT timing line: "00:00:00,100 --> 00:00:02,525"
_SRT_TIME_RE = re.compile(
    r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)"
)

# Critical issues fail the task; soft issues are warnings only.
_CRITICAL = {"black_frames", "audio_silent", "no_audio", "video_too_short", "unreadable"}


def _srt_line_seconds(line: str) -> float:
    """Duration of one SRT timing line (string form from file_to_subtitles)."""
    m = _SRT_TIME_RE.search(line or "")
    if not m:
        return 0.0
    g = [int(x) for x in m.groups()]
    start = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000.0
    end = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000.0
    return max(0.0, end - start)


def _thr(key: str, default: float) -> float:
    try:
        return float(config.app.get(f"quality_{key}", default))
    except (TypeError, ValueError):
        return default


def _run_ffmpeg(args: List[str], timeout: int = 180) -> str:
    """Run bundled ffmpeg and return combined stderr (where ffmpeg logs analysis)."""
    binary = utils.get_ffmpeg_binary()
    try:
        result = subprocess.run(
            [binary, "-hide_banner", "-nostats", *args],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return (result.stderr or "") + (result.stdout or "")
    except (OSError, subprocess.TimeoutExpired) as exc:
        logger.warning(f"quality ffmpeg probe failed: {exc}")
        return ""


def _parse_duration(text: str) -> float:
    m = _DURATION_RE.search(text)
    if not m:
        return 0.0
    h, mnt, s = m.groups()
    return int(h) * 3600 + int(mnt) * 60 + float(s)


def analyze_video(video_path: str) -> dict:
    """Return raw metrics for one mp4 using two ffmpeg passes."""
    metrics = {
        "duration": 0.0,
        "has_audio": False,
        "mean_volume": None,
        "max_volume": None,
        "black_duration": 0.0,
    }
    if not os.path.isfile(video_path) or os.path.getsize(video_path) == 0:
        metrics["unreadable"] = True
        return metrics

    # Pass 1: volume + duration + audio-stream presence.
    vol = _run_ffmpeg(["-i", video_path, "-af", "volumedetect", "-vn", "-f", "null", "-"])
    metrics["duration"] = _parse_duration(vol)
    metrics["has_audio"] = bool(_AUDIO_STREAM_RE.search(vol))
    mv = _MEAN_VOL_RE.search(vol)
    xv = _MAX_VOL_RE.search(vol)
    if mv:
        metrics["mean_volume"] = float(mv.group(1))
    if xv:
        metrics["max_volume"] = float(xv.group(1))

    # Pass 2: black-frame detection (sum all detected black spans).
    black = _run_ffmpeg(
        ["-i", video_path, "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"]
    )
    metrics["black_duration"] = sum(float(x) for x in _BLACK_DUR_RE.findall(black))
    return metrics


def check_video(
    video_path: str,
    audio_duration: float,
    subtitle_path: str,
    materials: List[str],
    subtitle_enabled: bool,
) -> dict:
    """Evaluate one final video. Returns {passed, critical, issues, metrics}."""
    m = analyze_video(video_path)
    issues: List[str] = []

    if m.get("unreadable"):
        return {"passed": False, "critical": True, "issues": ["unreadable"], "metrics": m}

    dur = m["duration"] or 0.0

    # Audio present & not silent.
    if not m["has_audio"]:
        issues.append("no_audio")
    elif m["mean_volume"] is not None and m["mean_volume"] < _thr("min_mean_db", -50.0):
        issues.append("audio_silent")

    # Length: visuals must not END BEFORE the narration (that cuts off the voice).
    # The pipeline intentionally pads video a little PAST the audio (safety margin),
    # so a longer video is fine — only flag short video, or absurd over-padding.
    if audio_duration and dur:
        if audio_duration - dur > _thr("max_audio_lead_s", 0.5):
            issues.append("video_too_short")  # critical: narration outlasts visuals
        elif dur - audio_duration > _thr("max_video_pad_s", 8.0):
            issues.append("video_too_long")  # soft: excessive trailing padding

    # Black / blank frames.
    if dur and m["black_duration"] > max(0.6, _thr("black_ratio", 0.06) * dur):
        issues.append("black_frames")

    # Subtitle coverage (soft).
    if subtitle_enabled and subtitle_path and os.path.isfile(subtitle_path) and dur:
        try:
            # file_to_subtitles returns (index, "HH:MM:SS,ms --> HH:MM:SS,ms", text).
            lines = subtitle_svc.file_to_subtitles(subtitle_path)
            covered = sum(_srt_line_seconds(item[1]) for item in lines if len(item) > 1)
            if covered / dur < _thr("min_sub_coverage", 0.45):
                issues.append("low_subtitle_coverage")
        except Exception as exc:  # parsing must never crash the gate
            logger.warning(f"subtitle coverage check skipped: {exc}")

    # Slideshow risk (soft): too few distinct clips for the length.
    distinct = len({os.path.basename(p) for p in (materials or [])})
    if dur > 8 and distinct < int(_thr("min_distinct_clips", 2)):
        issues.append("slideshow_risk")

    critical = any(i in _CRITICAL for i in issues)
    return {"passed": not critical, "critical": critical, "issues": issues, "metrics": m}


def check_videos(
    video_paths: List[str],
    audio_duration: float,
    subtitle_path: str,
    materials: List[str],
    subtitle_enabled: bool = True,
) -> dict:
    """Aggregate gate over all rendered videos.

    passed = every video clears the critical bar. Soft issues (slideshow_risk,
    low_subtitle_coverage) are surfaced but do not fail the task.
    """
    per_video = []
    for p in video_paths:
        r = check_video(p, audio_duration, subtitle_path, materials, subtitle_enabled)
        r["video"] = os.path.basename(p)
        per_video.append(r)
        level = "error" if r["critical"] else ("warning" if r["issues"] else "success")
        getattr(logger, level)(
            f"quality gate [{r['video']}]: "
            f"{'PASS' if r['passed'] else 'FAIL'} {r['issues']} {r['metrics']}"
        )

    passed = bool(per_video) and all(v["passed"] for v in per_video)
    all_issues = sorted({i for v in per_video for i in v["issues"]})
    return {"passed": passed, "issues": all_issues, "videos": per_video}
