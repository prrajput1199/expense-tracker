import type {
  Category,
  Expense,
  ExpenseInput,
  MonthlySummary,
  Period,
  YearlySummary,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

/** Turn FastAPI's error payloads into a readable message. */
function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: string[]; msg?: string }) => {
        const field = d.loc?.filter((p) => p !== "body").join(".");
        return field ? `${field}: ${d.msg}` : (d.msg ?? "Invalid value");
      })
      .join("; ");
  }
  return `Request failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the API running on port 8000?");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  return body as T;
}

export const api = {
  listCategories: () => request<Category[]>("/categories"),
  createCategory: (name: string, color: string) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify({ name, color }) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: "DELETE" }),

  listExpenses: ({ year, month }: Period) =>
    request<Expense[]>(`/expenses?year=${year}&month=${month}&limit=500`),
  createExpense: (input: ExpenseInput) =>
    request<Expense>("/expenses", { method: "POST", body: JSON.stringify(input) }),
  updateExpense: (id: number, input: Partial<ExpenseInput>) =>
    request<Expense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteExpense: (id: number) => request<void>(`/expenses/${id}`, { method: "DELETE" }),

  monthlySummary: ({ year, month }: Period) =>
    request<MonthlySummary>(`/reports/monthly?year=${year}&month=${month}`),
  yearlySummary: (year: number) => request<YearlySummary>(`/reports/yearly?year=${year}`),
};
