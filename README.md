# Centsible

**A free budgeting app built to make managing your money simple.**

Centsible helps college students and anyone trying to stay on top of their finances track income, control spending, build budgets, and understand how much money they actually have available.

Unlike many budgeting apps that require a paid subscription, Centsible is built around a simple idea: **you shouldn't have to spend money just to learn how to manage it.**

Whether you work hourly shifts, have an irregular schedule, or simply want a better way to keep track of your expenses, Centsible gives you one place to see where your money is going.

<!-- Add a screenshot: ![Centsible dashboard](docs/screenshot.png) -->

## Why I built it

Budgeting can be especially difficult for college students.

Income often comes from part-time or campus jobs and changes from week to week, while expenses range from groceries and transportation to subscriptions, textbooks, entertainment, and everyday spending.

At the same time, many popular budgeting tools place useful features behind monthly or yearly subscriptions. That can feel counterproductive when the goal of using the app is to **save money and stay on top of expenses in the first place**.

I built Centsible to provide a simple and free alternative.

The goal is to make it easy to answer a few important questions:

- How much money have I made?
- How much have I spent?
- Where is my money going?
- How much do I have left?
- Am I staying within my budget?
- How much should I be setting aside?

Centsible is designed with college students in mind, but it can be used by anyone who wants a straightforward way to manage their money.

## Features

- **Income and shift tracking:** log the date, hours worked, and hourly rate for each shift, and Centsible calculates your gross earnings automatically.
- **Budget categories:** create your own categories with monthly spending limits, such as food, transportation, entertainment, and subscriptions.
- **Expense logging:** record expenses and see where your money is going throughout the month.
- **Budget progress:** compare your spending against each category's monthly limit with progress bars.
- **Dashboard:** view income, spending, and how much you have left to spend from one place, with a chart of where your income goes.
- **Optional tax set-aside:** switch it on to reserve a share of your income for taxes, or leave it off. The rate is adjustable.
- **Month navigation:** move between months to review previous income, expenses, and budgets.
- **Responsive UI:** full-width layout on desktop, with a single-column interface and bottom navigation on phones.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Python, Flask, Flask-SQLAlchemy, Flask-CORS |
| Database | SQLite |
| Frontend | React 18, Vite, plain CSS |

## How it works

```text
Shift (hours × hourly rate)
      ↓
gross income
      ↓
optional tax set-aside
      ↓
available income
      ↓
expenses by budget category
      ↓
remaining money
```

Each shift is turned into gross income:

```text
hours worked × hourly rate = gross income
```

If the tax set-aside is switched on, Centsible estimates an amount to reserve before calculating available spending money:

```text
gross income − estimated tax set-aside = available income
```

Expenses are then compared against your budget categories so you can quickly see how much you have spent and how much remains.

The tax figure is calculated on demand from your shifts rather than stored, so changing the rate or switching it off immediately updates every number.

The tax logic lives in `backend/services/tax.py` as a standalone function with no Flask or database dependencies, which makes it easy to test and to replace with more advanced tax calculations later.

## Project structure

```text
finance_app/
├── backend/
│   ├── app.py              # models, routes, summary endpoint
│   ├── services/
│   │   └── tax.py          # calc_set_aside(gross, rate)
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── vite.config.js      # proxies /api to Flask
    └── src/
        ├── App.jsx         # layout, navigation, data loading
        ├── screens.jsx     # Home, Income, Budget, Tax
        ├── forms.jsx       # shift, expense, category forms
        ├── ui.jsx          # donut chart, modal, helpers
        ├── api.js          # fetch wrapper
        └── styles.css
```

## Getting started

You'll need **Python 3.10+** and **Node 18+**.

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

The API runs at `http://127.0.0.1:5000`. Visit `http://127.0.0.1:5000/api/health` and you should see:

```json
{"status":"ok"}
```

The SQLite database and default budget categories are created automatically on the first run.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite forwards `/api` requests to Flask, so no additional CORS configuration is required during development.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Server check |
| GET, POST | `/api/shifts` | List shifts (optional `?month=YYYY-MM`) or create one |
| DELETE | `/api/shifts/:id` | Remove a shift |
| GET, POST | `/api/categories` | List or create budget categories |
| DELETE | `/api/categories/:id` | Remove a category and its expenses |
| GET, POST | `/api/expenses` | List expenses (optional `?month=YYYY-MM`) or create one |
| DELETE | `/api/expenses/:id` | Remove an expense |
| GET, PUT | `/api/settings` | Read or update the tax switch and tax rate |
| GET | `/api/tax/set-aside` | Gross income, estimated tax set-aside, and available income |
| GET | `/api/summary?month=YYYY-MM` | Everything the dashboard needs in one call |

Example:

```bash
curl -X POST http://127.0.0.1:5000/api/shifts \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-09-29", "hours": 6, "pay_rate": 15}'
```

## Current limitations

Centsible is still an early-stage project.

- There is no login system yet, so the app is single-user and intended to run locally.
- Income comes from hourly shifts only. Salaried paychecks and other income sources are not supported yet.
- The tax set-aside is a configurable flat-rate estimate and should not be considered tax advice.
- Actual tax obligations vary depending on employment type, income, location, filing status, deductions, and other factors.

## Roadmap

- [x] Custom budget categories
- [x] Optional tax set-aside
- [ ] User accounts and authentication
- [ ] Support multiple income sources
- [ ] Recurring expenses and subscriptions
- [ ] Savings goals
- [ ] Spending insights and analytics
- [ ] Improved charts and financial summaries
- [ ] Automatic recurring transactions
- [ ] Student-focused financial tools
- [ ] Progressive tax estimates in place of the flat rate
- [ ] Email notifications and reminders
- [ ] Unit tests for tax and summary logic
- [ ] Cloud database support
- [ ] Deployment

## Vision

The long-term goal for Centsible is to become a **free personal finance platform designed around the financial realities of students and young adults**.

Instead of locking basic budgeting tools behind a subscription, Centsible aims to provide the tools needed to understand your finances, develop better spending habits, and make more informed decisions about your money.

**Budgeting should help you save money, not become another expense.**

## Author

**Joshua Ane**

[@Joshuaane88](https://github.com/Joshuaane88)
