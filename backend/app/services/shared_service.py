from sqlalchemy.orm import Session
from app.schemas.expense_schema import SharedExpenseIn, SharedExpenseOut
from app.services.expense_service import create_shared_expense, list_shared_expenses, update_shared_expense_status
def create_shared(db: Session, payload: SharedExpenseIn) -> None:
    create_shared_expense(db, payload)
def list_shared(db: Session) -> list[SharedExpenseOut]:
    return list_shared_expenses(db)
def set_shared_status(db: Session, expense_id: str, is_settled: bool) -> None:
    update_shared_expense_status(db, expense_id, is_settled)
