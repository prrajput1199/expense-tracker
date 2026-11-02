from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import schemas, services
from app.database import get_db

router = APIRouter(prefix="/reports", tags=["Reports"])

Year = Annotated[int, Query(ge=2000, le=2100, description="Four-digit year")]
Month = Annotated[int, Query(ge=1, le=12, description="Month number, 1-12")]


@router.get("/monthly", response_model=schemas.MonthlySummary)
def monthly_totals(year: Year, month: Month, db: Session = Depends(get_db)):
    """Total spent in one month, plus a breakdown per category."""
    return services.monthly_summary(db, year, month)


@router.get("/yearly", response_model=schemas.YearlySummary)
def yearly_totals(year: Year, db: Session = Depends(get_db)):
    """Total for each of the 12 months of a year (months with no spending = 0)."""
    return services.yearly_summary(db, year)
