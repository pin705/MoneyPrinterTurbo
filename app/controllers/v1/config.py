from fastapi import Request
from pydantic import BaseModel

from app.config import config
from app.controllers.v1.base import new_router
from app.utils import utils

# authentication dependency
# router = new_router(dependencies=[Depends(base.verify_token)])
router = new_router()


def _app_config() -> dict:
    """The editable [app] section (LLM + stock-footage provider settings).

    This backend is intended to run locally (or as the desktop sidecar), so the
    UI is allowed to read/write the user's own keys on their own machine — the
    same data the legacy Streamlit settings panel exposed.
    """
    return dict(config.app or {})


class ConfigUpdate(BaseModel):
    # Partial patch merged into the [app] section, e.g.
    # {"app": {"llm_provider": "deepseek", "deepseek_api_key": "sk-..."}}
    app: dict | None = None


@router.get("/config", summary="Get editable backend config")
def get_config(request: Request):
    return utils.get_response(200, {"app": _app_config()})


@router.post("/config", summary="Update backend config (writes config.toml)")
def update_config(request: Request, body: ConfigUpdate):
    if body.app:
        for key, value in body.app.items():
            config.app[key] = value
        config.save_config()
    return utils.get_response(200, {"app": _app_config()})
