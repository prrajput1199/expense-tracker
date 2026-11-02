# Ledger – Expense Tracker (FastAPI + React + PostgreSQL)

A full-stack expense tracker. Add expenses with a category and a date, browse them
by month, and see monthly totals broken down by category.

| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite, plain HTML/CSS                  |
| Backend  | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0           |
| Database | PostgreSQL (MySQL and SQLite also supported via one env var) |
| Tooling  | pytest, Docker Compose                                      |

## Features

- Create, edit and delete expenses (title, amount, date, category, optional note)
- Custom categories with colours (default set is seeded on first start)
- **Monthly totals** with a per-category breakdown and percentages
- **Year-at-a-glance** bar chart; click a month to jump to it
- Input validation on both sides (positive amounts, max 2 decimals, valid dates)
- Money stored as `NUMERIC(12,2)`, never floats
- Auto-generated API docs at `/docs`

## Project structure

```
expense-tracker/
├── docker-compose.yml          # Postgres + API + frontend
├── backend/
│   ├── app/
│   │   ├── main.py             # App setup, CORS, startup (create tables + seed)
│   │   ├── config.py           # Settings from env / .env (pydantic-settings)
│   │   ├── database.py         # Engine, session, get_db dependency
│   │   ├── models.py           # SQLAlchemy models: Category, Expense
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── services.py         # Query logic (CRUD + monthly/yearly reports)
│   │   └── routers/            # categories.py, expenses.py, reports.py
│   ├── tests/                  # pytest suite (in-memory SQLite)
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.tsx             # State, data loading, month navigation
    │   ├── api.ts              # Typed fetch client + error handling
    │   ├── types.ts            # Shared TypeScript interfaces
    │   ├── format.ts           # Currency / date helpers
    │   ├── styles.css
    │   └── components/         # SummaryPanel, ExpenseList, ExpenseForm, CategoryManager
    ├── vite.config.ts          # Dev proxy: /api -> FastAPI
    └── package.json
```

## Quick start with Docker (recommended)

```bash
docker compose up --build
```

- App: http://localhost:5173
- API docs: http://localhost:8000/docs

## Run without Docker

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then edit DATABASE_URL (see below)
uvicorn app.main:app --reload
```

The API runs on http://localhost:8000. Tables are created automatically on startup.

**Choosing a database** – set `DATABASE_URL` in `backend/.env`:

| Database   | URL                                                              |
|------------|------------------------------------------------------------------|
| PostgreSQL | `postgresql+psycopg2://expense_user:expense_pass@localhost:5432/expense_db` |
| MySQL      | `mysql+pymysql://expense_user:expense_pass@localhost:3306/expense_db`        |
| SQLite     | `sqlite:///./expenses.db` (default if nothing is set)                         |

Create the database first, e.g. for PostgreSQL:

```sql
CREATE USER expense_user WITH PASSWORD 'expense_pass';
CREATE DATABASE expense_db OWNER expense_user;
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to `http://localhost:8000`.
Optional settings (currency, locale) go in `frontend/.env` – see `.env.example`.

## API reference

All routes are prefixed with `/api`.

| Method | Path                    | Description                                           |
|--------|-------------------------|-------------------------------------------------------|
| GET    | `/categories`           | List categories                                       |
| POST   | `/categories`           | Create a category (`409` if the name already exists)  |
| DELETE | `/categories/{id}`      | Delete a category (`409` if it still has expenses)    |
| GET    | `/expenses`             | List expenses. Filters: `year`, `month`, `category_id`, `skip`, `limit` |
| POST   | `/expenses`             | Create an expense                                     |
| GET    | `/expenses/{id}`        | Get one expense                                       |
| PATCH  | `/expenses/{id}`        | Partially update an expense                           |
| DELETE | `/expenses/{id}`        | Delete an expense                                     |
| GET    | `/reports/monthly`      | **Monthly total** + per-category breakdown (`year`, `month`) |
| GET    | `/reports/yearly`       | Total for each month of a year (`year`)               |
| GET    | `/health`               | Health check (no `/api` prefix)                       |

### Example requests

```bash
# Add an expense
curl -X POST http://localhost:8000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Lunch","amount":250.50,"expense_date":"2025-03-10","category_id":1}'

# Monthly totals for March 2025
curl "http://localhost:8000/api/reports/monthly?year=2025&month=3"
```

Example response:

```json
{
  "year": 2025,
  "month": 3,
  "total": 1320.5,
  "count": 4,
  "by_category": [
    { "category_id": 1, "name": "Food", "color": "#0F766E", "total": 820.5, "count": 3, "percentage": 62.1 },
    { "category_id": 2, "name": "Transport", "color": "#2563EB", "total": 500.0, "count": 1, "percentage": 37.9 }
  ]
}
```

## Tests and checks

```bash
cd backend && pytest            # 13 API tests (validation, filters, monthly/yearly totals, ...)
cd frontend && npm run build    # type-checks with tsc, then builds with Vite
```

## Design notes

- **Layering**: routers handle HTTP, `services.py` holds the SQL, `schemas.py`
  validates input/output, `models.py` describes tables. Each is easy to test or swap.
- **Month filtering** uses a half-open date range (`>= first day`, `< first day of next month`),
  which uses the date index and behaves identically on PostgreSQL, MySQL and SQLite.
- **Money**: stored as `Numeric(12,2)` and handled as `Decimal` in Python, serialised to JSON numbers.
- **Frontend data flow**: `App` owns the selected month; after any create/edit/delete it
  re-fetches the list, monthly summary and yearly summary so all numbers stay in sync.
- **Dev proxy** avoids CORS in development; the API also ships CORS middleware
  (`CORS_ORIGINS`) for when the frontend is hosted on a different origin.

## Ideas for next steps

- Alembic migrations instead of `create_all`
- User accounts with JWT authentication (each user sees only their expenses)
- Budgets per category with over-budget warnings
- CSV export / import
- Frontend tests with Vitest and React Testing Library
