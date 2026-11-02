from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables on Base.metadata)
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import categories, expenses, reports
from app.services import seed_default_categories

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Simple bootstrap. For production schema changes, use Alembic migrations.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_default_categories(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Track expenses by category and date, and get monthly totals.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
