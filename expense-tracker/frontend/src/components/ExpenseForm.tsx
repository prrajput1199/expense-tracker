import { FormEvent, useEffect, useState } from "react";
import { todayISO } from "../format";
import type { Category, Expense, ExpenseInput } from "../types";

interface Props {
  categories: Category[];
  editing: Expense | null;
  onSubmit: (input: ExpenseInput) => Promise<boolean>;
  onCancel: () => void;
}

interface FormState {
  title: string;
  amount: string;
  date: string;
  categoryId: string;
  note: string;
}

const blank = (categoryId = ""): FormState => ({
  title: "",
  amount: "",
  date: todayISO(),
  categoryId,
  note: "",
});

export default function ExpenseForm({ categories, editing, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(blank());
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load the expense being edited, or reset to a blank form.
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        amount: String(editing.amount),
        date: editing.expense_date,
        categoryId: String(editing.category.id),
        note: editing.note ?? "",
      });
    } else {
      setForm((f) => blank(f.categoryId));
    }
    setProblem(null);
  }, [editing]);

  // Pre-select the first category once they have loaded.
  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((f) => ({ ...f, categoryId: String(categories[0].id) }));
    }
  }, [categories, form.categoryId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) return setProblem("Enter what you spent money on.");
    if (!Number.isFinite(amount) || amount <= 0) return setProblem("Amount must be greater than 0.");
    if (!form.categoryId) return setProblem("Pick a category.");

    setSaving(true);
    const ok = await onSubmit({
      title: form.title.trim(),
      amount: Math.round(amount * 100) / 100,
      expense_date: form.date,
      category_id: Number(form.categoryId),
      note: form.note.trim() || null,
    });
    setSaving(false);
    if (ok && !editing) setForm(blank(form.categoryId));
    if (ok) setProblem(null);
  };

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? "Edit expense" : "Add expense"}</h2>

      <label>
        What for
        <input value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
      </label>

      <div className="two">
        <label>
          Amount
          <input
            inputMode="decimal"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </label>
        <label>
          Date
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </label>
      </div>

      <label>
        Category
        <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Note (optional)
        <input value={form.note} maxLength={500} onChange={(e) => set("note", e.target.value)} />
      </label>

      {problem && (
        <p className="field-error" role="alert">
          {problem}
        </p>
      )}

      <div className="form-actions">
        <button className="primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add expense"}
        </button>
        {editing && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
