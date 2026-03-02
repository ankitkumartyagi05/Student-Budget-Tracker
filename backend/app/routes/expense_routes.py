from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.expense_schema import ExpenseIn, ExpenseOut
from app.services.expense_service import create_or_update_expense, delete_expense, list_expenses
router = APIRouter(tags=['expenses'])
@router.get('/expenses', response_model=list[ExpenseOut])
def get_expenses(db: Session = Depends(get_db)):
    return list_expenses(db)
@router.post('/expenses')
def create_expense(payload: ExpenseIn, db: Session = Depends(get_db)):
    create_or_update_expense(db, payload); return {'ok': True}
@router.put('/expenses/{expense_id}')
def update_expense(expense_id: str, payload: ExpenseIn, db: Session = Depends(get_db)):
    create_or_update_expense(db, ExpenseIn(id=expense_id, amount=payload.amount, category=payload.category, date=payload.date, notes=payload.notes, isShared=payload.isShared)); return {'ok': True}
@router.delete('/expenses/{expense_id}')
def remove_expense(expense_id: str, db: Session = Depends(get_db)):
    delete_expense(db, expense_id); return {'ok': True}
