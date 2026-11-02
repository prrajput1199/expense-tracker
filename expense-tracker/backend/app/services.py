"""Database logic, kept out of the route handlers so it is easy to test."""
from datetime import date
from decimal import Decimal

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app import models, schemas

TWO_PLACES = Decimal("0.01")


def to_decimal(value: object) -> Decimal:
    """Normalise whatever the DB driver returns (Decimal / float / None)."""
    return Decimal(str(value or 0)).quantize(TWO_PLACES)


def month_range(year: int, month: int) -> tuple[date, date]:
    """[start, end) range for a month. Works on every SQL database."""
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


# ---------------------------------------------------------------- categories
DEFAULT_CATEGORIES = [
    ("Food", "#0F766E"),
    ("Transport", "#2563EB"),
    ("Housing", "#7C3AED"),
    ("Health", "#DB2777"),
    ("Entertainment", "#D97706"),
    ("Other", "#64748B"),
]


def seed_default_categories(db: Session) -> None:
    if db.scalar(select(func.count(models.Category.id))) == 0:
        db.add_all(models.Category(name=n, color=c) for n, c in DEFAULT_CATEGORIES)
        db.commit()


def get_category_by_name(db: Session, name: str) -> models.Category | None:
    return db.scalar(
        select(models.Category).where(func.lower(models.Category.name) == name.lower())
    )


def list_categories(db: Session) -> list[models.Category]:
    return list(db.scalars(select(models.Category).order_by(models.Category.name)))


def create_category(db: Session, data: schemas.CategoryCreate) -> models.Category:
    category = models.Category(name=data.name.strip(), color=data.color)
    db.add(category)
    db.commit()
    return category


def category_has_expenses(db: Session, category_id: int) -> bool:
    return (
        db.scalar(
            select(func.count(models.Expense.id)).where(
                models.Expense.category_id == category_id
            )
        )
        > 0
    )


# ------------------------------------------------------------------ expenses
def list_expenses(
    db: Session,
    year: int | None = None,
    month: int | None = None,
    category_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[models.Expense]:
    stmt = select(models.Expense)
    if year and month:
        start, end = month_range(year, month)
        stmt = stmt.where(models.Expense.expense_date >= start, models.Expense.expense_date < end)
    elif year:
        stmt = stmt.where(
            models.Expense.expense_date >= date(year, 1, 1),
            models.Expense.expense_date < date(year + 1, 1, 1),
        )
    if category_id:
        stmt = stmt.where(models.Expense.category_id == category_id)
    stmt = (
        stmt.order_by(models.Expense.expense_date.desc(), models.Expense.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).unique())


def create_expense(db: Session, data: schemas.ExpenseCreate) -> models.Expense:
    expense = models.Expense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(
    db: Session, expense: models.Expense, data: schemas.ExpenseUpdate
) -> models.Expense:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


# ------------------------------------------------------------------- reports
def monthly_summary(db: Session, year: int, month: int) -> schemas.MonthlySummary:
    start, end = month_range(year, month)
    in_month = (models.Expense.expense_date >= start, models.Expense.expense_date < end)

    rows = db.execute(
        select(
            models.Category.id,
            models.Category.name,
            models.Category.color,
            func.sum(models.Expense.amount),
            func.count(models.Expense.id),
        )
        .join(models.Expense, models.Expense.category_id == models.Category.id)
        .where(*in_month)
        .group_by(models.Category.id, models.Category.name, models.Category.color)
        .order_by(func.sum(models.Expense.amount).desc())
    ).all()

    grand_total = sum((to_decimal(r[3]) for r in rows), Decimal("0.00"))
    by_category = [
        schemas.CategoryTotal(
            category_id=r[0],
            name=r[1],
            color=r[2],
            total=to_decimal(r[3]),
            count=r[4],
            percentage=round(float(to_decimal(r[3]) / grand_total * 100), 1) if grand_total else 0.0,
        )
        for r in rows
    ]
    return schemas.MonthlySummary(
        year=year,
        month=month,
        total=grand_total,
        count=sum(r[4] for r in rows),
        by_category=by_category,
    )


def yearly_summary(db: Session, year: int) -> schemas.YearlySummary:
    month_col = extract("month", models.Expense.expense_date)
    rows = db.execute(
        select(month_col, func.sum(models.Expense.amount), func.count(models.Expense.id))
        .where(
            models.Expense.expense_date >= date(year, 1, 1),
            models.Expense.expense_date < date(year + 1, 1, 1),
        )
        .group_by(month_col)
    ).all()
    by_month = {int(r[0]): (to_decimal(r[1]), r[2]) for r in rows}
    months = [
        schemas.MonthTotal(
            month=m,
            total=by_month.get(m, (Decimal("0.00"), 0))[0],
            count=by_month.get(m, (Decimal("0.00"), 0))[1],
        )
        for m in range(1, 13)
    ]
    return schemas.YearlySummary(
        year=year, total=sum((m.total for m in months), Decimal("0.00")), months=months
    )
