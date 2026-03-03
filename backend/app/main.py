"""FastAPI application factory: create_app(), routers, middleware, exception handlers."""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield
    # shutdown if needed


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Recipe & Event Management API",
        description="API for recipes and events with shared auth.",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url=None,
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    # ---------- Public: Health (no auth) ----------
    @app.get(
        "/health",
        summary="Health check",
        description="Public health check endpoint.",
        tags=["Health"],
    )
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # ---------- Auth (public: register, login; protected: me) ----------
    from app.modules.auth.routes import router as auth_router
    from app.modules.events.routes import router as events_router
    from app.modules.recipes.routes import router as recipes_router
    from app.modules.recipe_shares.routes import router as recipe_shares_router
    from app.modules.recipe_shares.routes import shared_router

    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(recipes_router, prefix="/recipes", tags=["Recipes"])
    app.include_router(recipe_shares_router, prefix="/recipes", tags=["RecipeShares"])
    app.include_router(shared_router, prefix="/shared", tags=["RecipeShares"])
    app.include_router(events_router, prefix="/events", tags=["Events"])

    return app


app = create_app()
