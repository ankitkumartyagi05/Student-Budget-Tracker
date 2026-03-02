from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget_schema import CategoryAlertOut, CategoryTotalOut, MonthlyTotalOut
from app.utils.helpers import generate_budget_alerts
from app.utils.scoring import calculate_financial_score
def category_totals(db: Session, month: str, user_id: str = 'local-user') -> list[CategoryTotalOut]:
    rows = db.query(Expense.category, func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.date.like(f'{month}%')).group_by(Expense.category).all()
    return [CategoryTotalOut(category=c, total=round(float(t or 0), 2)) for c, t in rows]
def monthly_totals(db: Session, last_months: int, user_id: str = 'local-user') -> list[MonthlyTotalOut]:
    rows = db.query(func.substr(Expense.date,1,7).label('month'), func.sum(Expense.amount)).filter(Expense.user_id == user_id).group_by('month').order_by('month').all()
    out = [MonthlyTotalOut(month=str(m), total=round(float(t or 0),2)) for m, t in rows]
    return out[-last_months:]
def budget_alerts(db: Session, month: str, user_id: str = 'local-user') -> list[CategoryAlertOut]:
    totals = category_totals(db, month, user_id); budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.month == month).all()
    total_map = {t.category: t.total for t in totals}; budget_map = {b.category: float(b.monthly_limit) for b in budgets}
    return [CategoryAlertOut(**i) for i in generate_budget_alerts(total_map, budget_map)]
def financial_score(db: Session, month: str, user_id: str = 'local-user') -> int:
    totals = category_totals(db, month, user_id); budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.month == month).all(); alerts = budget_alerts(db, month, user_id)
    return calculate_financial_score(sum(t.total for t in totals), sum(float(b.monthly_limit) for b in budgets), len(alerts))
def current_month() -> str:
    return datetime.utcnow().strftime('%Y-%m')
