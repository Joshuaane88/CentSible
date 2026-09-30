import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { CategoryForm, ExpenseForm, ShiftForm } from "./forms";
import Landing from "./landing";
import Loader from "./loader";
import { Budget, Home, Shifts, Tax } from "./screens";
import { Sheet, currentMonth, monthLabel, shiftMonth } from "./ui";
import Visuals from "./visuals";

const TABS = [
  { id: "home", label: "Dashboard" },
  { id: "shifts", label: "Income" },
  { id: "budget", label: "Budget" },
  { id: "visuals", label: "Visuals" },
  { id: "tax", label: "Tax" },
];

const LOADER_MS = 1800; // how long the coin toss plays on first load
const viewFromHash = () => (window.location.hash.startsWith("#app") ? "app" : "landing");

export default function App() {
  const [view, setView] = useState(viewFromHash());
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState("home");
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [sheet, setSheet] = useState(null); // "shift" | "expense" | "category" | null

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [view, tab]);

  const go = (v) => { window.location.hash = v === "app" ? "#app" : ""; };

  const refresh = useCallback(async () => {
    try {
      const [summary, shifts, expenses, categories, settings, visuals] = await Promise.all([
        api.summary(month),
        api.shifts(month),
        api.expenses(month),
        api.categories(),
        api.settings(),
        api.visuals(month),
      ]);
      setData({ summary, shifts, expenses, categories, settings, visuals });
      setLoadError("");
    } catch {
      setLoadError("Can't reach the server. Start the backend with python app.py, then reload.");
    }
  }, [month]);

  useEffect(() => { if (view === "app") refresh(); }, [view, refresh]);

  const saved = () => { setSheet(null); refresh(); };
  const remove = (label, action) => async () => {
    if (window.confirm(`Remove ${label}?`)) { await action(); refresh(); }
  };

  if (booting || (view === "app" && !data && !loadError)) return <Loader />;
  if (view === "landing") return <Landing onOpen={() => go("app")} />;

  const lastRate = data?.shifts[0]?.pay_rate;

  return (
    <div className="page">
      <header className="top">
        <div className="top-inner">
          <button className="wordmark" onClick={() => go("landing")} aria-label="Centsible home page">centsible</button>
          <nav className="nav" aria-label="Main">
            {TABS.map((t) => (
              <button key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          {tab !== "tax" ? (
            <div className="month" role="group" aria-label="Month">
              <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">‹</button>
              <span>{monthLabel(month)}</span>
              <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">›</button>
            </div>
          ) : (
            <span className="month-spacer" />
          )}
        </div>
      </header>

      <main className="content">
        {loadError && <p className="error banner" role="alert">{loadError}</p>}
        {data && tab === "home" && (
          <Home summary={data.summary} onAddShift={() => setSheet("shift")} onAddExpense={() => setSheet("expense")} />
        )}
        {data && tab === "shifts" && (
          <Shifts
            shifts={data.shifts}
            summary={data.summary}
            onAdd={() => setSheet("shift")}
            onDelete={(sh) => remove("this shift", () => api.delShift(sh.id))()}
          />
        )}
        {data && tab === "budget" && (
          <Budget
            summary={data.summary}
            expenses={data.expenses}
            onAddExpense={() => setSheet("expense")}
            onAddCategory={() => setSheet("category")}
            onDeleteExpense={(e) => remove("this expense", () => api.delExpense(e.id))()}
            onDeleteCategory={(c) => remove(`${c.name} and its expenses`, () => api.delCategory(c.id))()}
          />
        )}
        {data && tab === "visuals" && <Visuals visuals={data.visuals} summary={data.summary} />}
        {data && tab === "tax" && (
          <Tax
            enabled={data.settings.tax_enabled}
            rate={data.settings.tax_rate}
            summary={data.summary}
            onSave={async (payload) => { await api.saveSettings(payload); refresh(); }}
          />
        )}
      </main>

      {sheet === "shift" && (
        <Sheet title="Log a shift" onClose={() => setSheet(null)}>
          <ShiftForm defaultRate={lastRate} onSaved={saved} />
        </Sheet>
      )}
      {sheet === "expense" && data && (
        <Sheet title="Log an expense" onClose={() => setSheet(null)}>
          <ExpenseForm categories={data.categories} onSaved={saved} />
        </Sheet>
      )}
      {sheet === "category" && (
        <Sheet title="New category" onClose={() => setSheet(null)}>
          <CategoryForm onSaved={saved} />
        </Sheet>
      )}
    </div>
  );
}
