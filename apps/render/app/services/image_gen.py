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

import os
import subprocess

from loguru import logger

from app.config import config
from app.utils import utils

_pipe = None
_pipe_failed = False


def is_available() -> bool:
    import importlib.util as u

    return all(u.find_spec(m) for m in ("torch", "diffusers"))


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
    """Generate one image to out_path. Returns the path, or None on any failure."""
    if not is_available():
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
