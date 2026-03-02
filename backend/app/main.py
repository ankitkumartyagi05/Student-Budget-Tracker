import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if __package__ is None or __package__ == '':
    backend_root = str(Path(__file__).resolve().parents[1])
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

from app.config import settings
from app.database import Base, engine
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.group import Group
from app.models.profile import Profile
from app.models.settlement import Settlement
from app.models.shared_expense import SharedExpense, SharedParticipant
from app.models.user import User
from app.routes.analytics_routes import router as analytics_router
from app.routes.auth_routes import router as auth_router
from app.routes.budget_routes import router as budget_router
from app.routes.expense_routes import router as expense_router
from app.routes.shared_routes import router as shared_router
app = FastAPI(title=settings.app_name, version=settings.app_version)
origins = [o.strip() for o in settings.allowed_origins.split(',') if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
@app.on_event('startup')
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)
@app.get('/health')
def health() -> dict[str,str]:
    return {'status':'ok'}
app.include_router(auth_router, prefix='/api')
app.include_router(expense_router, prefix='/api')
app.include_router(budget_router, prefix='/api')
app.include_router(analytics_router, prefix='/api')
app.include_router(shared_router, prefix='/api')

if __name__ == '__main__':
    import os
    import uvicorn

    host = getattr(settings, 'host', None) or os.getenv('HOST', '127.0.0.1')
    port_value = getattr(settings, 'port', None) or os.getenv('PORT', '8000')
    try:
        port = int(port_value)
    except (TypeError, ValueError):
        port = 8000

    uvicorn.run('app.main:app', host=host, port=port, reload=True)
