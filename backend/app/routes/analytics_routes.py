from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.budget_schema import AIPlanOut
from app.services.ai_planning_service import generate_ai_plan
from app.services.intelligence_engine import budget_alerts, category_totals, current_month, financial_score, monthly_totals
router = APIRouter(tags=['analytics'])
@router.get('/analytics/category')
def get_category_totals(month: str = Query(default_factory=current_month), db: Session = Depends(get_db)):
    return category_totals(db, month)
@router.get('/analytics/monthly')
def get_monthly_totals(lastMonths: int = 6, db: Session = Depends(get_db)):
    return monthly_totals(db, lastMonths)
@router.get('/analytics/alerts')
def get_budget_alerts(month: str = Query(default_factory=current_month), db: Session = Depends(get_db)):
    return budget_alerts(db, month)
@router.get('/analytics/score')
def get_financial_score(month: str = Query(default_factory=current_month), db: Session = Depends(get_db)):
    return {'score': financial_score(db, month)}


@router.get('/analytics/ai-plan', response_model=AIPlanOut)
def get_ai_plan(
    historyMonths: int = 6,
    provider: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return generate_ai_plan(db, history_months=historyMonths, provider_override=provider)
