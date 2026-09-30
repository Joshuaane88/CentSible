import { CategoryBars, LineChart, TrendBars } from "./charts";
import { Donut, money } from "./ui";

const PALETTE = ["#fff94f", "#cdbbff", "#8df3cb", "#000000", "#ffb9d9", "#b9b2c9"];

export default function Visuals({ visuals: v, summary: s }) {
  const items = v.by_category.map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length] }));
  const spentItems = items.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent);
  const total = spentItems.reduce((a, c) => a + c.spent, 0);
  const hasTrend = v.trend.some((m) => m.income > 0 || m.spent > 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Visuals</h1>
          <p className="dot-label"><i className="dot" style={{ "--c": "var(--yellow)" }} />Spent this month</p>
          <p className="big">{money(total)}</p>
          <p className="muted">
            {total > 0 ? `Across ${spentItems.length} ${spentItems.length === 1 ? "category" : "categories"}.` : "No expenses logged yet."}
          </p>
        </div>
      </div>

      <div className="viz-grid">
        <section className="panel">
          <h2 className="panel-title">Spending by category</h2>
          {total === 0 ? (
            <p className="empty">Log an expense and it shows up here, split by category.</p>
          ) : (
            <div className="viz-donut">
              <Donut size={190} segments={spentItems.map((c) => ({ value: c.spent, color: c.color }))} />
              <ul className="legend">
                {spentItems.map((c) => (
                  <li key={c.id}>
                    <i className="dot" style={{ "--c": c.color }} />
                    <span>{c.name}</span>
                    <b>{money(c.spent)} <em className="pct">{Math.round((c.spent / total) * 100)}%</em></b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title">Spent against monthly limits</h2>
          {items.length === 0 ? (
            <p className="empty">Add a budget category to compare spending against a limit.</p>
          ) : (
            <CategoryBars items={items} />
          )}
        </section>

        <section className="panel wide">
          <h2 className="panel-title">Spending across the month</h2>
          <p className="muted panel-sub">Running total by day, against the income you have available.</p>
          {total === 0 ? (
            <p className="empty">No spending to chart yet.</p>
          ) : (
            <LineChart points={v.cumulative.slice(0, v.plot_days)} totalDays={v.cumulative.length} cap={s.spendable} />
          )}
        </section>

        <section className="panel wide">
          <h2 className="panel-title">Income and spending, last 6 months</h2>
          {hasTrend ? <TrendBars months={v.trend} /> : <p className="empty">Log shifts and expenses to see the trend.</p>}
        </section>
      </div>
    </>
  );
}
