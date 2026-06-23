"""Phase 3 — local AI image generation (free, no API key).

Generates a still per scene with a local Stable Diffusion model (diffusers,
`sd-turbo` by default — 1-2 steps, fast) and turns it into a short Ken-Burns
clip the existing compositor can use. For abstract topics where stock footage is
weak. All heavy imports are lazy and every failure falls back to None, so a
machine without torch/diffusers (or a model download failure) never breaks a
render — it just uses stock instead.

Activate with `image_provider = "local"` in config.toml. First run downloads the
model (~2.5GB for sd-turbo). Runs on MPS (Apple), CUDA, or CPU.
"""

import importlib
import os
import shutil
import subprocess
import sys

from loguru import logger

from app.config import config
from app.utils import utils

_pipe = None
_pipe_failed = False

# Heavy local-AI deps (installed on demand, never required for the stock path).
_DEPS = ["torch", "diffusers", "transformers", "accelerate", "safetensors"]


def is_available() -> bool:
    import importlib.util as u

    return all(u.find_spec(m) for m in ("torch", "diffusers"))


def _free_gb(path: str | None = None) -> float:
    try:
        _, _, free = shutil.disk_usage(path or os.path.dirname(sys.executable))
        return free / (1024**3)
    except Exception:
        return 0.0


def _model_id() -> str:
    return config.app.get("image_model", "stabilityai/sd-turbo")


def _model_present(model: str | None = None) -> bool:
    model = model or _model_id()
    cache = os.path.expanduser(
        os.environ.get("HF_HOME", "~/.cache/huggingface")
    )
    hub = os.path.join(os.path.expanduser(cache), "hub")
    folder = "models--" + model.replace("/", "--")
    return os.path.isdir(os.path.join(hub, folder))


def ensure_installed(auto_install: bool | None = None) -> bool:
    """Make the local-AI deps available. Auto-installs via uv on demand.

    Returns True if torch/diffusers are importable. On a machine without them it
    will (when allowed and there's enough disk) run `uv pip install …` once;
    otherwise it logs a clear recommendation and returns False so the caller
    falls back to stock footage.
    """
    if is_available():
        return True
    if auto_install is None:
        auto_install = bool(config.app.get("image_auto_install", True))
    if not auto_install:
        logger.warning(
            "local AI is off-disk and auto-install is disabled → using stock. "
            "Install once with: uv pip install " + " ".join(_DEPS)
        )
        return False

    need = float(config.app.get("image_min_free_gb", 6.0))
    free = _free_gb()
    if free < need:
        logger.warning(
            f"local AI needs ~{need:.0f}GB free but only {free:.1f}GB available → "
            "using stock. Free up disk, or use a cloud image key (FLUX/DALL·E) instead."
        )
        return False

    uv = shutil.which("uv")
    if not uv:
        logger.warning(
            "`uv` not found → can't auto-install local AI. Install manually: "
            "uv pip install " + " ".join(_DEPS)
        )
        return False

    logger.info(
        f"local AI not installed — auto-installing ({', '.join(_DEPS)}) once, ~2GB; "
        f"{free:.1f}GB free…"
    )
    try:
        subprocess.run(
            [uv, "pip", "install", "--python", sys.executable, *_DEPS],
            check=True,
            timeout=1800,
        )
    except Exception as e:
        logger.warning(f"local AI auto-install failed ({e}) → using stock.")
        return False
    importlib.invalidate_caches()
    ok = is_available()
    logger.info(f"local AI install {'complete' if ok else 'incomplete'}")
    return ok


def status() -> dict:
    """Snapshot of the local-AI image feature — for the UI and the update check."""
    model = _model_id()
    return {
        "feature": "local-ai-image",
        "enabled": config.app.get("image_provider", "none") == "local",
        "installed": is_available(),
        "model": model,
        "model_present": _model_present(model),
        "device": _device() if is_available() else None,
        "free_gb": round(_free_gb(), 1),
        "min_free_gb": float(config.app.get("image_min_free_gb", 6.0)),
    }


def check_update() -> dict:
    """For the app update check: is local AI enabled but missing deps/model?"""
    s = status()
    s["needs_setup"] = bool(s["enabled"] and (not s["installed"] or not s["model_present"]))
    if not s["enabled"]:
        s["recommendation"] = "Local AI images are off (using stock footage)."
    elif s["free_gb"] < s["min_free_gb"]:
        s["recommendation"] = (
            f"Local AI enabled but only {s['free_gb']}GB free "
            f"(need ~{s['min_free_gb']:.0f}GB). Free disk or use a cloud image key."
        )
    elif s["needs_setup"]:
        s["recommendation"] = "Local AI enabled — run setup to install deps + download the model."
    else:
        s["recommendation"] = "Local AI ready."
    return s


def setup() -> dict:
    """Install deps + pre-download the model (used by the setup/update flow)."""
    if ensure_installed():
        try:
            _get_pipe()  # triggers the one-time model download into the HF cache
        except Exception as e:
            logger.warning(f"model preload failed: {e}")
    return status()


def _device():
    import torch

    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _get_pipe():
    """Lazily build + cache the diffusers pipeline. Returns None on failure."""
    global _pipe, _pipe_failed
    if _pipe is not None or _pipe_failed:
        return _pipe
    try:
        import torch
        from diffusers import AutoPipelineForText2Image

        model = config.app.get("image_model", "stabilityai/sd-turbo")
        device = _device()
        # fp32 on MPS avoids the occasional all-black fp16 output; CUDA uses fp16.
        dtype = torch.float16 if device == "cuda" else torch.float32
        logger.info(f"loading image model '{model}' on {device} ({dtype})…")
        pipe = AutoPipelineForText2Image.from_pretrained(model, torch_dtype=dtype)
        pipe = pipe.to(device)
        pipe.set_progress_bar_config(disable=True)
        try:
            pipe.safety_checker = None  # avoid false-positive black frames on b-roll
        except Exception:
            pass
        _pipe = pipe
        logger.success("image model ready")
    except Exception as e:
        logger.warning(f"image model unavailable, will fall back to stock: {e}")
        _pipe_failed = True
    return _pipe


def generate_image(prompt: str, out_path: str, width: int = 512, height: int = 512) -> str | None:
    """Generate one image to out_path. Returns the path, or None on any failure.

    Auto-installs the local-AI deps on first use (falls back to stock if it can't).
    """
    if not ensure_installed():
        return None
    pipe = _get_pipe()
    if pipe is None:
        return None
    try:
        steps = int(config.app.get("image_steps", 2))
        # sd-turbo: guidance_scale must be 0; few steps.
        result = pipe(
            prompt=prompt,
            num_inference_steps=max(1, steps),
            guidance_scale=float(config.app.get("image_guidance", 0.0)),
            height=height,
            width=width,
        )
        result.images[0].save(out_path)
        return out_path if os.path.isfile(out_path) and os.path.getsize(out_path) > 0 else None
    except Exception as e:
        logger.warning(f"image generation failed for {prompt!r}: {e}")
        return None


def image_to_kenburns_clip(
    image_path: str, out_path: str, duration: float, width: int, height: int, fps: int = 30
) -> str | None:
    """Turn a still into a slow zoom (Ken Burns) mp4 at the target resolution."""
    if not image_path or not os.path.isfile(image_path):
        return None
    frames = max(1, int(round(duration * fps)))
    # Pre-scale (cover) to 2x so zoompan has headroom, then slow zoom-in.
    vf = (
        f"scale={width*2}:{height*2}:force_original_aspect_ratio=increase,"
        f"crop={width*2}:{height*2},"
        f"zoompan=z='min(zoom+0.0008,1.18)':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s={width}x{height}:fps={fps},format=yuv420p"
    )
    cmd = [
        utils.get_ffmpeg_binary(), "-hide_banner", "-loglevel", "error", "-y",
        "-loop", "1", "-i", image_path, "-t", f"{duration:.2f}",
        "-vf", vf, "-r", str(fps), "-an",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", out_path,
    ]
    try:
        subprocess.run(cmd, capture_output=True, timeout=120, check=True)
        return out_path if os.path.isfile(out_path) and os.path.getsize(out_path) > 0 else None
    except Exception as e:
        logger.warning(f"ken-burns clip failed: {e}")
        return None
