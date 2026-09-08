"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.config import settings
from app.database import engine, Base, async_session_factory
from app.models.models import User
from app.routers import auth, expenses, incomes, goals, subscriptions, projects, categories, excel

logger = logging.getLogger(__name__)


async def _run_startup_recurring() -> None:
    """Gastos recurrentes por lógica de aplicación (p. ej. inversión S&P500 el
    día 2): al arrancar, si toca y falta la fila del mes, se crea para el
    usuario más antiguo (la app es de un único usuario por ahora)."""
    try:
        async with async_session_factory() as session:
            user_id = (
                await session.execute(select(User.id).order_by(User.created_at).limit(1))
            ).scalar_one_or_none()
            if user_id:
                from app.services.recurring import ensure_recurring_expense

                await ensure_recurring_expense(session, user_id, True)  # arranque: regla del dueño
    except Exception:  # no debe impedir que la API arranque
        logger.exception("recurring check at startup failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await _run_startup_recurring()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, 'https://gastos.cabrasky.net'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(incomes.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(excel.router, prefix="/api")


@app.get("/api/health")
async def health():
    try:
        with open("/app/version.txt") as f:
            version = f.read().strip()
    except OSError:
        version = "dev"
    return {"status": "ok", "app": settings.app_name, "version": version}
