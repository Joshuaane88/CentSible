import { useState } from "react";
import { Chevron, Donut, dayLabel, money } from "./ui";

const INK = "#000";
const YELLOW = "#fff94f";
const LAVENDER = "#cdbbff";
const CAT_TONES = ["var(--yellow)", "var(--mint)", "var(--lavender)"];

function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map((it) => (
        <li key={it.label}>
          <i className="dot" style={{ "--c": it.color }} />
          <span>{it.label}</span>
          <b>{money(it.value)}</b>
        </li>
      ))}
    </ul>
  );
}

export function Home({ summary: s, onAddShift, onAddExpense }) {
  const overspent = s.remaining < 0;
  const segments = [
    ...(s.tax_enabled ? [{ value: s.set_aside, color: INK }] : []),
    { value: s.spent, color: LAVENDER },
    { value: Math.max(s.remaining, 0), color: YELLOW },
  ];
  const legend = [
    ...(s.tax_enabled ? [{ label: "Set aside for tax", value: s.set_aside, color: INK }] : []),
    { label: "Spent", value: s.spent, color: LAVENDER },
    { label: overspent ? "Over budget by" : "Left to spend", value: Math.abs(s.remaining), color: YELLOW },
  ];
  const empty = s.gross === 0 && s.spent === 0;

  return (
    <div className="split">
      <section className="panel hero">
        <p className="dot-label">
          <i className="dot" style={{ "--c": "var(--yellow)" }} />
          {overspent ? "Over budget by" : "Left to spend this month"}
        </p>
        <p className="big xl">{money(Math.abs(s.remaining))}</p>
        <p className="muted">
          {s.gross > 0 || s.spent > 0
            ? `You've earned ${money(s.gross)} and spent ${money(s.spent)} so far.`
            : "Nothing logged this month yet."}
        </p>

        <dl className="stats">
          <div><dt>Income</dt><dd>{money(s.gross)}</dd></div>
          {s.tax_enabled && <div><dt>Set aside for tax</dt><dd>{money(s.set_aside)}</dd></div>}
          <div><dt>Spent</dt><dd>{money(s.spent)}</dd></div>
        </dl>

        <div className="cta-group">
          <button className="bar-cta yellow" onClick={onAddShift}>
            <span>Log a shift <em>hours × rate</em></span><Chevron />
          </button>
          <button className="bar-cta lavender" onClick={onAddExpense}>
            <span>Log an expense <em>from available income</em></span><Chevron />
          </button>
        </div>
      </section>

      <section className="panel">
        <p className="dot-label"><i className="dot" style={{ "--c": "var(--yellow)" }} />Where your income goes</p>
        {empty ? (
          <p className="empty">Log a shift and Centsible shows how much is spent, set aside, and still yours.</p>
        ) : (
          <div className="alloc">
            <div className="donut-wrap"><Donut segments={segments} /></div>
            <Legend items={legend} />
          </div>
        )}
      </section>
    </div>
  );
}

export function Shifts({ shifts, summary: s, onAdd, onDelete }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Income</h1>
          <p className="dot-label"><i className="dot" style={{ "--c": "var(--yellow)" }} />Earned this month</p>
          <p className="big">{money(s.gross)}</p>
          <p className="muted">{s.hours} hours worked across your shifts.</p>
        </div>
        <button className="bar-cta yellow head-cta" onClick={onAdd}>
          <span>Log a shift</span><Chevron />
        </button>
      </div>

      <div className="stack grid">
        {shifts.length === 0 && (
          <p className="empty">No income logged this month. Add a shift to start tracking what you earn.</p>
        )}
        {shifts.map((sh) => (
          <article className="card mint-card" key={sh.id}>
            <div className="card-top">
              <div>
                <h3>{dayLabel(sh.date)}</h3>
                <p className="muted">{sh.hours} h at {money(sh.pay_rate)}/h</p>
              </div>
              <p className="amount">{money(sh.gross)}</p>
            </div>
            <div className="card-bottom">
              {s.tax_enabled ? <span className="pill">{money(sh.gross * s.tax_rate)} set aside</span> : <span />}
              <button className="text-btn" onClick={() => onDelete(sh)}>Remove</button>
            </div>
          </article>
        ))}
      </div>

    </>
  );
}

export function Budget({ summary: s, expenses, onAddExpense, onAddCategory, onDeleteExpense, onDeleteCategory }) {
  const over = s.remaining < 0;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Budget</h1>
          <p className="dot-label"><i className="dot" style={{ "--c": "var(--yellow)" }} />{over ? "Over budget by" : "Left to spend"}</p>
          <p className="big">{money(Math.abs(s.remaining))}</p>
          <p className="muted">{money(s.spent)} spent from {money(s.spendable)} of available income.</p>
        </div>
        <div className="head-actions">
          <button className="bar-cta yellow" onClick={onAddExpense}>
            <span>Log an expense</span><Chevron />
          </button>
          <button className="bar-cta white" onClick={onAddCategory}>
            <span>New category</span><Chevron />
          </button>
        </div>
      </div>

      <div className="stack grid">
        {s.categories.map((c, i) => {
          const pct = c.monthly_limit > 0 ? (c.spent / c.monthly_limit) * 100 : 0;
          const isOver = c.monthly_limit > 0 && c.spent > c.monthly_limit;
          return (
            <article className="card lav-card" key={c.id}>
              <div className="card-top">
                <h3><i className="dot" style={{ "--c": CAT_TONES[i % 3] }} /> {c.name}</h3>
                <p className="muted">{money(c.spent)} of {money(c.monthly_limit)}</p>
              </div>
              <div className="track" role="progressbar" aria-label={`${c.name} spending`}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(Math.round(pct), 100)}>
                <div className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="card-bottom">
                <span className={isOver ? "pill dark" : "pill"}>
                  {c.monthly_limit === 0 ? "No limit set" : isOver ? `Over by ${money(c.spent - c.monthly_limit)}` : `${Math.round(pct)}% used`}
                </span>
                <button className="text-btn" onClick={() => onDeleteCategory(c)}>Remove</button>
              </div>
            </article>
          );
        })}
      </div>

      <h2 className="section">History</h2>
      {expenses.length === 0 ? (
        <p className="empty">Nothing spent this month.</p>
      ) : (
        <ul className="history">
          {expenses.map((e) => (
            <li key={e.id}>
              <div>
                <b>{e.note || e.category}</b>
                <p className="muted">{e.category}, {dayLabel(e.date)}</p>
              </div>
              <div className="history-right">
                <b>{money(e.amount)}</b>
                <button className="text-btn" onClick={() => onDeleteExpense(e)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Tax({ enabled, rate, summary: s, onSave }) {
  const savedPct = Math.round(rate * 100);
  const [pct, setPct] = useState(savedPct);
  const [err, setErr] = useState("");
  const changed = pct !== savedPct;

  const run = async (payload) => {
    setErr("");
    try { await onSave(payload); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="panel narrow">
      <h1>Tax set-aside</h1>
      <p className="muted lead">
        Optional. Turn this on to hold back a share of your income for taxes before you budget the rest.
      </p>

      <div className="switch-row">
        <span id="tax-switch-label">Set money aside for taxes</span>
        <button
          className={enabled ? "switch on" : "switch"}
          role="switch"
          aria-checked={enabled}
          aria-labelledby="tax-switch-label"
          onClick={() => run({ tax_enabled: !enabled })}
        >
          <i />
        </button>
      </div>

      {enabled && (
        <>
          <p className="dot-label"><i className="dot" style={{ "--c": "var(--yellow)" }} />Share of your income</p>
          <p className="big">{pct}%</p>
          <input
            className="range"
            type="range"
            min="0"
            max="40"
            step="1"
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            style={{ "--pct": `${(pct / 40) * 100}%` }}
            aria-label="Tax set-aside percentage"
          />
          <p className="muted range-note">On a $100 shift, you keep {money(100 - pct)} and set aside {money(pct)}.</p>
          {changed && <button className="btn" onClick={() => run({ tax_rate: pct / 100 })}>Save {pct}%</button>}
        </>
      )}

      <h2 className="section-sm">Based on your income</h2>
      <dl className="stats basis">
        <div><dt>Income logged in {s.year}</dt><dd>{money(s.ytd_gross)}</dd></div>
        <div>
          <dt>{enabled ? `Set aside so far at ${pct}%` : `Would set aside at ${pct}%`}</dt>
          <dd>{money(Math.round(s.ytd_gross * pct) / 100)}</dd>
        </div>
        <div><dt>This month at {pct}%</dt><dd>{money(Math.round(s.gross * pct) / 100)}</dd></div>
      </dl>
      {!enabled && <p className="muted">Switch the set-aside on and these amounts come out of your available income.</p>}

      {err && <p className="error" role="alert">{err}</p>}

      <hr className="rule" />
      <p className="muted">
        This is a flat estimate, not tax advice. What you actually owe depends on your income, where you live, and
        your filing status.
      </p>
    </div>
  );
}
