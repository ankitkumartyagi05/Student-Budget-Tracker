import json
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.shared_expense import SharedExpense
from app.schemas.expense_schema import ExpenseIn, ExpenseOut, SharedExpenseIn, SharedExpenseOut
def list_expenses(db: Session, user_id: str = 'local-user') -> list[ExpenseOut]:
    rows = db.query(Expense).filter(Expense.user_id == user_id).all()
    return [ExpenseOut(id=r.id, amount=r.amount, category=r.category, date=r.date, notes=r.notes, isShared=r.is_shared) for r in rows]
def create_or_update_expense(db: Session, payload: ExpenseIn, user_id: str = 'local-user') -> None:
    row = db.query(Expense).filter(Expense.id == payload.id).first()
    if row is None:
        row = Expense(id=payload.id, user_id=user_id, amount=payload.amount, category=payload.category, date=payload.date, notes=payload.notes, is_shared=payload.isShared); db.add(row)
    else:
        row.amount = payload.amount; row.category = payload.category; row.date = payload.date; row.notes = payload.notes; row.is_shared = payload.isShared
    db.commit()
def delete_expense(db: Session, expense_id: str) -> None:
    db.query(Expense).filter(Expense.id == expense_id).delete(); db.commit()
def list_shared_expenses(db: Session) -> list[SharedExpenseOut]:
    rows = db.query(SharedExpense).all()
    return [SharedExpenseOut(id=r.id, description=r.description, totalAmount=r.total_amount, paidBy=r.paid_by, participants=json.loads(r.participants_json), date=r.date, isSettled=r.is_settled) for r in rows]
def create_shared_expense(db: Session, payload: SharedExpenseIn) -> None:
    row = db.query(SharedExpense).filter(SharedExpense.id == payload.id).first()
    participants_json = json.dumps([{'name': p.name, 'share': p.share} for p in payload.participants])
    if row is None:
        row = SharedExpense(id=payload.id, description=payload.description, total_amount=payload.totalAmount, paid_by=payload.paidBy, participants_json=participants_json, date=payload.date, is_settled=False); db.add(row)
    else:
        row.description = payload.description; row.total_amount = payload.totalAmount; row.paid_by = payload.paidBy; row.participants_json = participants_json; row.date = payload.date
    db.commit()
def update_shared_expense_status(db: Session, expense_id: str, is_settled: bool) -> None:
    row = db.query(SharedExpense).filter(SharedExpense.id == expense_id).first()
    if row: row.is_settled = is_settled; db.commit()
