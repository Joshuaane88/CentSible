import { useState } from "react";
import { api } from "./api";
import { Field, todayStr } from "./ui";

function useSubmit(action, onSaved) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await action();
      onSaved();
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };
  return { err, busy, submit };
}

export function ShiftForm({ defaultRate, onSaved }) {
  const [date, setDate] = useState(todayStr());
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState(defaultRate ?? "");
  const { err, busy, submit } = useSubmit(
    () => api.addShift({ date, hours: Number(hours), pay_rate: Number(rate) }),
    onSaved
  );
  const gross = Number(hours) * Number(rate);

  return (
    <form onSubmit={submit}>
      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <div className="row">
        <Field label="Hours worked">
          <input type="number" inputMode="decimal" step="any" min="0" value={hours}
            onChange={(e) => setHours(e.target.value)} placeholder="6" required />
        </Field>
        <Field label="Pay per hour ($)">
          <input type="number" inputMode="decimal" step="any" min="0" value={rate}
            onChange={(e) => setRate(e.target.value)} placeholder="15" required />
        </Field>
      </div>
      {gross > 0 && <p className="hint">Gross for this shift: ${gross.toFixed(2)}</p>}
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn" disabled={busy}>Save shift</button>
    </form>
  );
}

export function ExpenseForm({ categories, defaultCategory, onSaved }) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategory ?? categories[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const { err, busy, submit } = useSubmit(
    () => api.addExpense({ amount: Number(amount), category_id: Number(categoryId), note, date }),
    onSaved
  );

  return (
    <form onSubmit={submit}>
      <Field label="Amount ($)">
        <input type="number" inputMode="decimal" step="any" min="0" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="12.50" required />
      </Field>
      <Field label="Category">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Chipotle" />
      </Field>
      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn" disabled={busy || !categories.length}>Save expense</button>
    </form>
  );
}

export function CategoryForm({ onSaved }) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const { err, busy, submit } = useSubmit(
    () => api.addCategory({ name, monthly_limit: Number(limit || 0) }),
    onSaved
  );

  return (
    <form onSubmit={submit}>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Groceries" required />
      </Field>
      <Field label="Monthly limit ($)">
        <input type="number" inputMode="decimal" step="any" min="0" value={limit}
          onChange={(e) => setLimit(e.target.value)} placeholder="200" />
      </Field>
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn" disabled={busy}>Add category</button>
    </form>
  );
}
