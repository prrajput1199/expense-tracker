export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  note: string | null;
  category: Category;
  created_at: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  expense_date: string;
  category_id: number;
  note?: string | null;
}

export interface CategoryTotal {
  category_id: number;
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total: number;
  count: number;
  by_category: CategoryTotal[];
}

export interface YearlySummary {
  year: number;
  total: number;
  months: { month: number; total: number; count: number }[];
}

export interface Period {
  year: number;
  month: number; // 1-12
}
