import { formatDay, formatMoney } from "../format";
import type { Expense } from "../types";

interface Props {
  expenses: Expense[];
  loading: boolean;
  editingId: number | null;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}

export default function ExpenseList({ expenses, loading, editingId, onEdit, onDelete }: Props) {
  return (
    <section className="panel" aria-busy={loading}>
      <h2>Expenses</h2>
      {expenses.length === 0 ? (
        <p className="empty">
          {loading ? "Loading…" : "No expenses this month. Add one using the form."}
        </p>
      ) : (
        <ul className="expenses">
          {expenses.map((e) => (
            <li key={e.id} className={e.id === editingId ? "row editing" : "row"}>
              <span className="date">{formatDay(e.expense_date)}</span>
              <span className="swatch" style={{ background: e.category.color }} aria-hidden />
              <span className="desc">
                <span className="title">{e.title}</span>
                <span className="muted">
                  {e.category.name}
                  {e.note ? ` – ${e.note}` : ""}
                </span>
              </span>
              <span className="amt">{formatMoney(e.amount)}</span>
              <span className="actions">
                <button className="link-btn" onClick={() => onEdit(e)}>
                  Edit
                </button>
                <button className="link-btn danger" onClick={() => onDelete(e)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
