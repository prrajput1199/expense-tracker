"""Pydantic models: request validation and response serialisation."""
from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

# Decimals are kept exact internally, but sent to the browser as JSON numbers.
Money = Annotated[
    Decimal, PlainSerializer(float, return_type=float, when_used="json")
]
PositiveAmount = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
HexColor = Annotated[str, Field(pattern=r"^#[0-9A-Fa-f]{6}$")]


# ---------------------------------------------------------------- categories
class CategoryCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=50)]
    color: HexColor = "#64748B"


class CategoryRead(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ------------------------------------------------------------------ expenses
class ExpenseBase(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=120)]
    amount: PositiveAmount
    expense_date: date
    category_id: int
    note: Annotated[str, Field(max_length=500)] | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    """All fields optional so the client can send a partial update."""

    title: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    amount: PositiveAmount | None = None
    expense_date: date | None = None
    category_id: int | None = None
    note: Annotated[str, Field(max_length=500)] | None = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    amount: Money
    expense_date: date
    note: str | None
    category: CategoryRead
    created_at: datetime


# ------------------------------------------------------------------- reports
class CategoryTotal(BaseModel):
    category_id: int
    name: str
    color: str
    total: Money
    count: int
    percentage: float


class MonthlySummary(BaseModel):
    year: int
    month: int
    total: Money
    count: int
    by_category: list[CategoryTotal]


class MonthTotal(BaseModel):
    month: int
    total: Money
    count: int


class YearlySummary(BaseModel):
    year: int
    total: Money
    months: list[MonthTotal]
