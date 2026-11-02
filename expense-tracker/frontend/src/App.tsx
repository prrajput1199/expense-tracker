import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import CategoryManager from "./components/CategoryManager";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import SummaryPanel from "./components/SummaryPanel";
import { currentPeriod, monthName } from "./format";
import type {
  Category,
  Expense,
  ExpenseInput,
  MonthlySummary,
  Period,
  YearlySummary,
} from "./types";

export default function App() {
  const [period, setPeriod] = useState<Period>(currentPeriod);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [yearly, setYearly] = useState<YearlySummary | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setCategories(await api.listCategories());
  }, []);

  const loadPeriod = useCallback(async (p: Period) => {
    const [list, monthly, year] = await Promise.all([
      api.listExpenses(p),
      api.monthlySummary(p),
      api.yearlySummary(p.year),
    ]);
    setExpenses(list);
    setSummary(monthly);
    setYearly(year);
  }, []);

  // Initial load + whenever the selected month changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadCategories(), loadPeriod(period)])
      .then(() => !cancelled && setError(null))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, loadCategories, loadPeriod]);

  /** Run a mutation, then refresh the numbers. Errors surface in the banner. */
  const mutate = async (action: () => Promise<unknown>, refreshCategories = false) => {
    try {
      await action();
      await Promise.all([loadPeriod(period), refreshCategories ? loadCategories() : null]);
      setError(null);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  const saveExpense = (input: ExpenseInput) =>
    mutate(async () => {
      if (editing) await api.updateExpense(editing.id, input);
      else await api.createExpense(input);
      // Jump to the month the expense belongs to so the user sees it.
      const [y, m] = input.expense_date.split("-").map(Number);
      setEditing(null);
      if (y !== period.year || m !== period.month) setPeriod({ year: y, month: m });
    });

  const deleteExpense = (e: Expense) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    void mutate(() => api.deleteExpense(e.id));
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(period.year, period.month - 1 + delta, 1);
    setPeriod({ year: d.getFullYear(), month: d.getMonth() + 1 });
    setEditing(null);
  };

  return (
    <div className="shell">
      <header className="topbar">
        <h1>Ledger</h1>
        <nav className="month-nav" aria-label="Choose month">
          <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <span className="month-label" aria-live="polite">
            {monthName(period.month)} {period.year}
          </span>
          <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
            ›
          </button>
        </nav>
      </header>

      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button className="link-btn" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <main className="layout">
        <div className="col-main">
          <SummaryPanel
            summary={summary}
            yearly={yearly}
            period={period}
            loading={loading}
            onSelectMonth={(month) => setPeriod({ ...period, month })}
          />
          <ExpenseList
            expenses={expenses}
            loading={loading}
            editingId={editing?.id ?? null}
            onEdit={setEditing}
            onDelete={deleteExpense}
          />
        </div>

        <aside className="col-side">
          <ExpenseForm
            categories={categories}
            editing={editing}
            onSubmit={saveExpense}
            onCancel={() => setEditing(null)}
          />
          <CategoryManager
            categories={categories}
            onAdd={(name, color) => mutate(() => api.createCategory(name, color), true)}
            onDelete={(c) => mutate(() => api.deleteCategory(c.id), true)}
          />
        </aside>
      </main>
    </div>
  );
}
