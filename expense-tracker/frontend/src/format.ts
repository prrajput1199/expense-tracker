const LOCALE = import.meta.env.VITE_LOCALE ?? "en-IN";
const CURRENCY = import.meta.env.VITE_CURRENCY ?? "INR";

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

export const formatMoney = (value: number) => moneyFormatter.format(value);

export const monthName = (month: number, style: "long" | "short" = "long") =>
  new Date(2000, month - 1, 1).toLocaleDateString(LOCALE, { month: style });

/** "2025-03-09" -> "9 Mar". Parsed manually to avoid timezone shifts. */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
}

/** Today as YYYY-MM-DD in the user's local timezone. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentPeriod() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
