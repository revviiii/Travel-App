from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Backend services for the collaborative Travel App.",
    )
    application.include_router(api_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()
