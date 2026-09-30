import calendar
from datetime import date

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

from services.tax import calc_set_aside

# ---------------------------------------------------------------- setup
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///finance.db"
CORS(app)
db = SQLAlchemy(app)


# --------------------------------------------------------------- models
class Setting(db.Model):
    """One row. Optional tax set-aside: on/off switch plus a flat rate (0.15 = 15%)."""
    id = db.Column(db.Integer, primary_key=True)
    tax_rate = db.Column(db.Float, nullable=False, default=0.15)
    tax_enabled = db.Column(db.Boolean, nullable=False, default=True)


class Shift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    hours = db.Column(db.Float, nullable=False)
    pay_rate = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "hours": self.hours,
            "pay_rate": self.pay_rate,
            "gross": round(self.hours * self.pay_rate, 2),
        }


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), nullable=False)
    monthly_limit = db.Column(db.Float, nullable=False, default=0)
    # deleting a category also deletes its expenses
    expenses = db.relationship(
        "Expense", backref="category", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {"id": self.id, "name": self.name, "monthly_limit": self.monthly_limit}


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    note = db.Column(db.String(120), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "category_id": self.category_id,
            "category": self.category.name,
            "amount": self.amount,
            "date": self.date.isoformat(),
            "note": self.note or "",
        }


# -------------------------------------------------------------- helpers
def get_settings():
    s = Setting.query.first()
    if not s:
        s = Setting(tax_rate=0.15)
        db.session.add(s)
        db.session.commit()
    return s


def set_aside_for(gross, settings):
    """Tax is optional: when it's switched off, nothing is set aside."""
    return calc_set_aside(gross, settings.tax_rate) if settings.tax_enabled else 0


def ensure_columns():
    """Add columns introduced after a database was first created (create_all won't)."""
    cols = [row[1] for row in db.session.execute(text("PRAGMA table_info(setting)"))]
    if cols and "tax_enabled" not in cols:
        db.session.execute(text("ALTER TABLE setting ADD COLUMN tax_enabled BOOLEAN NOT NULL DEFAULT 1"))
        db.session.commit()


def month_bounds(month_str):
    """'2026-09' -> (date(2026,9,1), date(2026,9,30)). None -> current month."""
    if month_str:
        year, month = (int(x) for x in month_str.split("-"))
    else:
        today = date.today()
        year, month = today.year, today.month
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def in_month(model, month_str):
    start, end = month_bounds(month_str)
    return model.query.filter(model.date >= start, model.date <= end)


def seed_defaults():
    get_settings()
    if Category.query.count() == 0:
        for name, limit in [("Food", 300), ("Transport", 100), ("Fun", 100), ("Other", 50)]:
            db.session.add(Category(name=name, monthly_limit=limit))
        db.session.commit()


@app.errorhandler(KeyError)
def missing_field(e):
    return jsonify(error=f"Missing field: {e.args[0]}"), 400


@app.errorhandler(ValueError)
def bad_value(e):
    return jsonify(error="That value doesn't look right. Check the numbers and date."), 400


# --------------------------------------------------------------- health
@app.route("/api/health")
def health():
    return jsonify(status="ok")


# --------------------------------------------------------------- shifts
@app.route("/api/shifts", methods=["POST"])
def create_shift():
    data = request.get_json()
    hours = float(data["hours"])
    pay_rate = float(data["pay_rate"])
    if hours <= 0 or pay_rate < 0:
        return jsonify(error="Hours must be above 0 and pay rate can't be negative."), 400
    shift = Shift(date=date.fromisoformat(data["date"]), hours=hours, pay_rate=pay_rate)
    db.session.add(shift)
    db.session.commit()
    return jsonify(shift.to_dict()), 201


@app.route("/api/shifts", methods=["GET"])
def list_shifts():
    query = in_month(Shift, request.args.get("month")) if request.args.get("month") else Shift.query
    shifts = query.order_by(Shift.date.desc(), Shift.id.desc()).all()
    return jsonify([s.to_dict() for s in shifts])


@app.route("/api/shifts/<int:shift_id>", methods=["DELETE"])
def delete_shift(shift_id):
    shift = db.get_or_404(Shift, shift_id)
    db.session.delete(shift)
    db.session.commit()
    return "", 204


# ----------------------------------------------------------- categories
@app.route("/api/categories", methods=["GET"])
def list_categories():
    return jsonify([c.to_dict() for c in Category.query.order_by(Category.id).all()])


@app.route("/api/categories", methods=["POST"])
def create_category():
    data = request.get_json()
    name = str(data["name"]).strip()
    if not name:
        return jsonify(error="Give the category a name."), 400
    cat = Category(name=name, monthly_limit=float(data.get("monthly_limit", 0)))
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


@app.route("/api/categories/<int:cat_id>", methods=["DELETE"])
def delete_category(cat_id):
    cat = db.get_or_404(Category, cat_id)
    db.session.delete(cat)
    db.session.commit()
    return "", 204


# ------------------------------------------------------------- expenses
@app.route("/api/expenses", methods=["POST"])
def create_expense():
    data = request.get_json()
    amount = float(data["amount"])
    if amount <= 0:
        return jsonify(error="Amount must be above 0."), 400
    db.get_or_404(Category, int(data["category_id"]))
    expense = Expense(
        category_id=int(data["category_id"]),
        amount=amount,
        date=date.fromisoformat(data["date"]),
        note=str(data.get("note", "")).strip()[:120],
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@app.route("/api/expenses", methods=["GET"])
def list_expenses():
    query = in_month(Expense, request.args.get("month")) if request.args.get("month") else Expense.query
    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()
    return jsonify([e.to_dict() for e in expenses])


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    expense = db.get_or_404(Expense, expense_id)
    db.session.delete(expense)
    db.session.commit()
    return "", 204


# ------------------------------------------------------------- settings
@app.route("/api/settings", methods=["GET"])
def read_settings():
    s = get_settings()
    return jsonify(tax_enabled=s.tax_enabled, tax_rate=s.tax_rate)


@app.route("/api/settings", methods=["PUT"])
def update_settings():
    data = request.get_json()
    settings = get_settings()
    if "tax_rate" in data:
        rate = float(data["tax_rate"])
        if not 0 <= rate <= 0.6:
            return jsonify(error="Tax rate must be between 0% and 60%."), 400
        settings.tax_rate = rate
    if "tax_enabled" in data:
        settings.tax_enabled = bool(data["tax_enabled"])
    db.session.commit()
    return jsonify(tax_enabled=settings.tax_enabled, tax_rate=settings.tax_rate)


# ------------------------------------------------ tax + summary (the join)
@app.route("/api/tax/set-aside", methods=["GET"])
def tax_set_aside():
    """Tax reads from shifts. Nothing is stored, it's computed each time."""
    settings = get_settings()
    shifts = in_month(Shift, request.args.get("month")).all()
    gross = sum(s.hours * s.pay_rate for s in shifts)
    set_aside = set_aside_for(gross, settings)
    return jsonify(gross=round(gross, 2), set_aside=set_aside,
                   spendable=round(gross - set_aside, 2),
                   tax_rate=settings.tax_rate, tax_enabled=settings.tax_enabled)


@app.route("/api/summary", methods=["GET"])
def summary():
    """Everything the dashboard needs in one call.
    shifts -> income -> optional tax set-aside -> available -> minus expenses -> remaining
    """
    month = request.args.get("month")
    settings = get_settings()

    shifts = in_month(Shift, month).all()
    gross = sum(s.hours * s.pay_rate for s in shifts)
    set_aside = set_aside_for(gross, settings)
    spendable = round(gross - set_aside, 2)

    expenses = in_month(Expense, month).all()
    spent = round(sum(e.amount for e in expenses), 2)

    categories = []
    for c in Category.query.order_by(Category.id).all():
        c_spent = round(sum(e.amount for e in expenses if e.category_id == c.id), 2)
        categories.append({**c.to_dict(), "spent": c_spent})

    # Year-to-date income, so the tax page can total everything logged this year
    start, _ = month_bounds(month)
    year_shifts = Shift.query.filter(
        Shift.date >= date(start.year, 1, 1), Shift.date <= date(start.year, 12, 31)
    ).all()
    ytd_gross = sum(s.hours * s.pay_rate for s in year_shifts)

    return jsonify(
        year=start.year,
        ytd_gross=round(ytd_gross, 2),
        ytd_set_aside=set_aside_for(ytd_gross, settings),
        tax_rate=settings.tax_rate,
        tax_enabled=settings.tax_enabled,
        hours=round(sum(s.hours for s in shifts), 2),
        gross=round(gross, 2),
        set_aside=set_aside,
        spendable=spendable,
        spent=spent,
        remaining=round(spendable - spent, 2),
        categories=categories,
    )


# -------------------------------------------------------------- visuals
def add_months(first_of_month, delta):
    idx = first_of_month.year * 12 + (first_of_month.month - 1) + delta
    return date(idx // 12, idx % 12 + 1, 1)


@app.route("/api/visuals", methods=["GET"])
def visuals():
    """Data for the charts: spending by category, spending over the month,
    and income vs spending for the last 6 months."""
    month = request.args.get("month")
    start, end = month_bounds(month)
    expenses = in_month(Expense, month).all()

    by_category = []
    for c in Category.query.order_by(Category.id).all():
        spent = round(sum(e.amount for e in expenses if e.category_id == c.id), 2)
        by_category.append({**c.to_dict(), "spent": spent})

    # running total of spending for each day of the month
    daily = [0.0] * end.day
    for e in expenses:
        daily[e.date.day - 1] += e.amount
    cumulative, running = [], 0.0
    for v in daily:
        running += v
        cumulative.append(round(running, 2))

    # how many days of the line to draw (don't draw the future)
    today = date.today()
    last_expense_day = max((e.date.day for e in expenses), default=0)
    if start > today:
        plot_days = 0
    elif end < today:
        plot_days = end.day
    else:
        plot_days = max(today.day, last_expense_day)

    trend = []
    for offset in range(-5, 1):
        m_start = add_months(start, offset)
        m_end = date(m_start.year, m_start.month, calendar.monthrange(m_start.year, m_start.month)[1])
        income = sum(
            s.hours * s.pay_rate
            for s in Shift.query.filter(Shift.date >= m_start, Shift.date <= m_end).all()
        )
        spent = sum(
            e.amount
            for e in Expense.query.filter(Expense.date >= m_start, Expense.date <= m_end).all()
        )
        trend.append({
            "month": m_start.strftime("%Y-%m"),
            "label": m_start.strftime("%b"),
            "income": round(income, 2),
            "spent": round(spent, 2),
        })

    return jsonify(by_category=by_category, cumulative=cumulative, plot_days=plot_days, trend=trend)


# ------------------------------------------------------------------ run
with app.app_context():
    db.create_all()
    ensure_columns()
    seed_defaults()

if __name__ == "__main__":
    app.run(debug=True)
