# PyInstaller spec — bundles the FastAPI backend into a single binary that the
# Tauri desktop app spawns as a sidecar.
#
# Build:  pyinstaller --clean -y packaging/mpt-backend.spec   (run from apps/render)
# Output: apps/render/dist/mpt-backend  (then renamed by scripts/build-sidecar.sh)
#
# NOTE: onefile keeps the sidecar a single executable (what Tauri externalBin
# wants) but extracts to a temp dir on startup — slower for the large resource/
# bundle. For production consider onedir + shipping resource/ as Tauri resources.

import os
import sys

from PyInstaller.utils.hooks import collect_all, collect_submodules, copy_metadata

# The spec lives in apps/render/packaging; the backend is one level up.
ROOT = os.path.abspath(os.path.join(SPECPATH, os.pardir))
sys.path.insert(0, ROOT)  # so collect_submodules("app") can import the package

datas = [
    (os.path.join(ROOT, "config.example.toml"), "."),
    (os.path.join(ROOT, "resource"), "resource"),
]
binaries = []
hiddenimports = [
    "uvicorn.logging",
    "uvicorn.loops.auto",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan.on",
]

# Pull in data files + submodules for libraries PyInstaller can't fully trace.
for pkg in ("faster_whisper", "edge_tts", "moviepy", "litellm"):
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hiddenimports += h
    except Exception:
        pass

# These call importlib.metadata.version() at import time, so their dist-info
# metadata must be bundled (collect_all does not include it).
for pkg in ("imageio", "imageio_ffmpeg", "moviepy", "numpy", "tqdm", "decorator", "proglog"):
    try:
        datas += copy_metadata(pkg)
    except Exception:
        pass

hiddenimports += collect_submodules("app")


a = Analysis(
    [os.path.join(ROOT, "main.py")],
    pathex=[ROOT],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=["streamlit", "tkinter"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="mpt-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
