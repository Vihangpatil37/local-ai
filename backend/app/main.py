"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import dashboard, health, keys, logs, proxy


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    # CORS: only allow the configured frontend origin(s). No wildcard in prod.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    app.include_router(health.router)
    app.include_router(keys.router)
    app.include_router(dashboard.router)
    app.include_router(logs.router)
    app.include_router(proxy.router)

    @app.get("/")
    def root():
        return {"app": settings.app_name, "status": "running"}

    return app


app = create_app()
