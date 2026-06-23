"""Application configuration - root APIRouter.

Defines all FastAPI application endpoints.

Resources:
    1. https://fastapi.tiangolo.com/tutorial/bigger-applications

"""

from fastapi import APIRouter

from app.controllers import ping
from app.controllers.v1 import config, llm, video

root_api_router = APIRouter()
# v1
root_api_router.include_router(video.router)
root_api_router.include_router(llm.router)
root_api_router.include_router(config.router)
# health check at /api/v1/ping (used by the desktop sidecar + web status)
root_api_router.include_router(ping.router, prefix="/api/v1", tags=["Health Check"])
