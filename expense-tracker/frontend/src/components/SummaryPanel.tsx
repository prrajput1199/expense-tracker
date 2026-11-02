import { formatMoney, monthName } from "../format";
import type { MonthlySummary, Period, YearlySummary } from "../types";

interface Props {
  summary: MonthlySummary | null;
  yearly: YearlySummary | null;
  period: Period;
  loading: boolean;
  onSelectMonth: (month: number) => void;
}

export default function SummaryPanel({ summary, yearly, period, loading, onSelectMonth }: Props) {
  const total = summary?.total ?? 0;
  const peak = Math.max(1, ...(yearly?.months.map((m) => m.total) ?? [0]));

  return (
    <section className="panel summary" aria-busy={loading}>
      <p className="muted">Spent in {monthName(period.month)}</p>
      <p className="total">{formatMoney(total)}</p>
      <p className="muted">
        {summary?.count ?? 0} {summary?.count === 1 ? "expense" : "expenses"}
      </p>

      {summary && summary.by_category.length > 0 ? (
        <>
          {/* The stacked bar: one segment per category, sized by share of the month. */}
          <div className="stack" role="img" aria-label="Spending split by category">
            {summary.by_category.map((c) => (
              <span
                key={c.category_id}
                style={{ flexGrow: c.total, background: c.color }}
                title={`${c.name}: ${formatMoney(c.total)}`}
              />
            ))}
          </div>
          <ul className="breakdown">
            {summary.by_category.map((c) => (
              <li key={c.category_id}>
                <span className="swatch" style={{ background: c.color }} />
                <span className="name">{c.name}</span>
                <span className="pct">{c.percentage}%</span>
                <span className="amt">{formatMoney(c.total)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        !loading && <p className="muted">Nothing spent yet this month.</p>
      )}

      {yearly && (
        <div className="year">
          <p className="muted">
            {period.year} so far: <strong>{formatMoney(yearly.total)}</strong>
          </p>
          <div className="year-bars">
            {yearly.months.map((m) => (
              <button
                key={m.month}
                className={m.month === period.month ? "bar active" : "bar"}
                onClick={() => onSelectMonth(m.month)}
                title={`${monthName(m.month)}: ${formatMoney(m.total)}`}
                aria-label={`${monthName(m.month)}, ${formatMoney(m.total)}`}
                aria-pressed={m.month === period.month}
              >
                <span className="fill" style={{ height: `${Math.max(4, (m.total / peak) * 100)}%` }} />
                <span className="tick">{monthName(m.month, "short").slice(0, 3)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
