from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.budget_schema import BudgetIn, BudgetOut
from app.services.budget_service import create_or_update_budget, list_budgets
router = APIRouter(tags=['budgets'])
@router.get('/budgets', response_model=list[BudgetOut])
def get_budgets(month: str | None = Query(default=None), db: Session = Depends(get_db)):
    return list_budgets(db, month)
@router.post('/budgets')
def create_budget(payload: BudgetIn, db: Session = Depends(get_db)):
    create_or_update_budget(db, payload); return {'ok': True}
