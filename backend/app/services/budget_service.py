from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.schemas.budget_schema import BudgetIn, BudgetOut
def list_budgets(db: Session, month: str | None = None, user_id: str = 'local-user') -> list[BudgetOut]:
    q = db.query(Budget).filter(Budget.user_id == user_id)
    if month: q = q.filter(Budget.month == month)
    rows = q.all()
    return [BudgetOut(id=r.id, month=r.month, category=r.category, monthlyLimit=r.monthly_limit) for r in rows]
def create_or_update_budget(db: Session, payload: BudgetIn, user_id: str = 'local-user') -> None:
    row = db.query(Budget).filter(Budget.id == payload.id).first()
    if row is None: row = Budget(id=payload.id, user_id=user_id, month=payload.month, category=payload.category, monthly_limit=payload.monthlyLimit); db.add(row)
    else: row.month = payload.month; row.category = payload.category; row.monthly_limit = payload.monthlyLimit
    db.commit()
