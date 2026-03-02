from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.expense_schema import SharedExpenseIn, SharedExpenseOut, SharedExpenseStatusUpdate
from app.services.shared_service import create_shared, list_shared, set_shared_status
router = APIRouter(tags=['shared-expenses'])
@router.get('/shared-expenses', response_model=list[SharedExpenseOut])
def get_shared_expenses(db: Session = Depends(get_db)):
    return list_shared(db)
@router.post('/shared-expenses')
def create_shared_expense(payload: SharedExpenseIn, db: Session = Depends(get_db)):
    create_shared(db, payload); return {'ok': True}
@router.patch('/shared-expenses/{expense_id}/status')
def update_shared_status(expense_id: str, payload: SharedExpenseStatusUpdate, db: Session = Depends(get_db)):
    set_shared_status(db, expense_id, payload.isSettled); return {'ok': True}
