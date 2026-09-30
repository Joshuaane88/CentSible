import { money } from "./ui";

const compact = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

// Horizontal bars: spent per category, with a tick at each monthly limit.
export function CategoryBars({ items }) {
  const scaleMax = Math.max(...items.map((i) => Math.max(i.spent, i.monthly_limit)), 1);
  return (
    <>
      <ul className="cbars">
        {items.map((i) => {
          const over = i.monthly_limit > 0 && i.spent > i.monthly_limit;
          return (
            <li key={i.id}>
              <div className="cbar-head">
                <span><i className="dot" style={{ "--c": i.color }} />{i.name}</span>
                <b>
                  {money(i.spent)}
                  <em> / {i.monthly_limit > 0 ? money(i.monthly_limit) : "no limit"}</em>
                </b>
              </div>
              <div className="cbar-track">
                <div className="cbar-fill" style={{ width: `${(i.spent / scaleMax) * 100}%`, background: i.color }} />
                {i.monthly_limit > 0 && (
                  <div className="cbar-limit" style={{ left: `${(i.monthly_limit / scaleMax) * 100}%` }} />
                )}
              </div>
              {over && <p className="cbar-over">Over by {money(i.spent - i.monthly_limit)}</p>}
            </li>
          );
        })}
      </ul>
      <p className="muted chart-note">The black tick marks each category's monthly limit.</p>
    </>
  );
}

// Running total of spending across the month, with available income as a ceiling.
export function LineChart({ points, totalDays, cap }) {
  if (points.length === 0) return <p className="empty">No days to plot yet for this month.</p>;

  const W = 640, H = 270, pad = { l: 56, r: 16, t: 18, b: 30 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const yMax = Math.max(cap || 0, ...points, 1) * 1.08;
  const x = (i) => pad.l + (totalDays > 1 ? (i / (totalDays - 1)) * pw : 0);
  const y = (v) => pad.t + ph - (v / yMax) * ph;

  const line = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const last = points[points.length - 1];
  const grid = [0, 0.5, 1].map((f) => f * yMax);
  const xTicks = [...new Set([1, 8, 15, 22, totalDays])].filter((d) => d <= totalDays);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Spending reached ${money(last)} by day ${points.length} of the month`}>
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="rgba(0,0,0,0.12)" />
          <text x={pad.l - 10} y={y(g) + 4} textAnchor="end" fontSize="12" fill="rgba(0,0,0,0.62)">{compact(g)}</text>
        </g>
      ))}
      {cap > 0 && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={y(cap)} y2={y(cap)} stroke="#000" strokeWidth="1.5" strokeDasharray="6 5" />
          <text x={W - pad.r} y={y(cap) - 7} textAnchor="end" fontSize="12" fontWeight="600">Available income</text>
        </g>
      )}
      <path d={area} fill="#cdbbff" opacity="0.55" />
      <path d={line} fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last)} r="6" fill="#fff94f" stroke="#000" strokeWidth="2.5" />
      {xTicks.map((d) => (
        <text key={d} x={x(d - 1)} y={H - 8} textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.62)">{d}</text>
      ))}
    </svg>
  );
}

// Grouped bars: income vs spending for each of the last months.
export function TrendBars({ months }) {
  const W = 640, H = 270, pad = { l: 8, r: 8, t: 16, b: 32 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const max = Math.max(...months.flatMap((m) => [m.income, m.spent]), 1) * 1.1;
  const group = pw / months.length;
  const barW = Math.min(36, group * 0.3);
  const h = (v) => (v / max) * ph;
  const base = pad.t + ph;

  return (
    <>
      <div className="chart-legend">
        <span><i className="swatch" style={{ background: "#000" }} />Income</span>
        <span><i className="swatch" style={{ background: "#fff94f", border: "1.5px solid #000" }} />Spent</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Income and spending for the last six months">
        <line x1={pad.l} x2={W - pad.r} y1={base} y2={base} stroke="rgba(0,0,0,0.25)" />
        {months.map((m, i) => {
          const cx = pad.l + group * i + group / 2;
          return (
            <g key={m.month}>
              <rect x={cx - barW - 2} y={base - h(m.income)} width={barW} height={Math.max(h(m.income), 0)} rx="6" fill="#000">
                <title>{`${m.label} income: ${money(m.income)}`}</title>
              </rect>
              <rect x={cx + 2} y={base - h(m.spent)} width={barW} height={Math.max(h(m.spent), 0)} rx="6" fill="#fff94f" stroke="#000" strokeWidth="1.5">
                <title>{`${m.label} spent: ${money(m.spent)}`}</title>
              </rect>
              <text x={cx} y={H - 9} textAnchor="middle" fontSize="13" fill="rgba(0,0,0,0.75)">{m.label}</text>
            </g>
          );
        })}
      </svg>
    </>
  );
}
