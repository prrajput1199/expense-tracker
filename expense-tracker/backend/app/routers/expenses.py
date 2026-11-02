from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas, services
from app.database import get_db

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _get_or_404(db: Session, expense_id: int) -> models.Expense:
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found.")
    return expense


def _ensure_category(db: Session, category_id: int) -> None:
    if db.get(models.Category, category_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found.")


@router.get("", response_model=list[schemas.ExpenseRead])
def list_expenses(
    db: Session = Depends(get_db),
    year: Annotated[int | None, Query(ge=2000, le=2100)] = None,
    month: Annotated[int | None, Query(ge=1, le=12)] = None,
    category_id: int | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    if month and not year:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "`month` requires `year`.")
    return services.list_expenses(db, year, month, category_id, skip, limit)


@router.post("", response_model=schemas.ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    _ensure_category(db, payload.category_id)
    return services.create_expense(db, payload)


@router.get("/{expense_id}", response_model=schemas.ExpenseRead)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, expense_id)


@router.patch("/{expense_id}", response_model=schemas.ExpenseRead)
def update_expense(expense_id: int, payload: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = _get_or_404(db, expense_id)
    if payload.category_id is not None:
        _ensure_category(db, payload.category_id)
    return services.update_expense(db, expense, payload)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, expense_id))
    db.commit()
