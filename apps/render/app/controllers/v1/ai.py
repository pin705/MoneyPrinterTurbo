"""Local-AI lifecycle endpoints.

Lets the app (and the update check) see whether the optional local AI image
generator is installed/ready and trigger a one-time setup (install deps +
download the model). Footage stays the default; this only matters when the user
opts into `image_provider = "local"`.
"""

from fastapi import Request

from app.controllers.v1.base import new_router
from app.services import image_gen
from app.utils import utils

router = new_router()


@router.get("/ai/status", summary="Local AI image generator status")
def ai_status(request: Request):
    return utils.get_response(200, image_gen.status())


@router.get(
    "/ai/check-update",
    summary="Whether local AI needs install/update (call alongside the app update check)",
)
def ai_check_update(request: Request):
    return utils.get_response(200, image_gen.check_update())


@router.post(
    "/ai/setup",
    summary="Install local AI deps + download the model (one-time, several GB)",
)
def ai_setup(request: Request):
    return utils.get_response(200, image_gen.setup())
