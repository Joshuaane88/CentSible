const BASE = "/api";

async function req(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Something went wrong. Try again.");
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  summary: (m) => req(`/summary?month=${m}`),
  shifts: (m) => req(`/shifts?month=${m}`),
  addShift: (body) => req("/shifts", { method: "POST", body }),
  delShift: (id) => req(`/shifts/${id}`, { method: "DELETE" }),
  visuals: (m) => req(`/visuals?month=${m}`),
  categories: () => req("/categories"),
  addCategory: (body) => req("/categories", { method: "POST", body }),
  delCategory: (id) => req(`/categories/${id}`, { method: "DELETE" }),
  expenses: (m) => req(`/expenses?month=${m}`),
  addExpense: (body) => req("/expenses", { method: "POST", body }),
  delExpense: (id) => req(`/expenses/${id}`, { method: "DELETE" }),
  settings: () => req("/settings"),
  saveSettings: (body) => req("/settings", { method: "PUT", body }),
};
