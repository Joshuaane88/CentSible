import { useEffect } from "react";

export const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const pad = (n) => String(n).padStart(2, "0");

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const currentMonth = () => todayStr().slice(0, 7);

export const shiftMonth = (m, delta) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const monthLabel = (m) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// "2026-09-29" -> "Tue, Sep 29" (parsed as local so the day never shifts)
export const dayLabel = (iso) => {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export function Chevron() {
  return (
    <svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true">
      <path d="M1 1l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Ring chart. segments: [{ value, color }]
export function Donut({ segments, size = 210 }) {
  const r = 42;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + Math.max(s.value, 0), 0);
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Allocation of this month's income">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#efe9de" strokeWidth="9" />
      {total > 0 &&
        segments.map((s, i) => {
          const len = (Math.max(s.value, 0) / total) * C;
          if (len <= 0) return null;
          const gap = Math.min(1.6, len * 0.3);
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="9"
              strokeDasharray={`${len - gap} ${C - len + gap}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
