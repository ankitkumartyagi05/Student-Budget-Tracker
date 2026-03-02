from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user_schema import UserCreate, UserLogin, UserOut
from app.services.auth_service import login_user, register_user
router = APIRouter(tags=['auth'])
@router.post('/register', response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = register_user(db, payload)
    if not user: raise HTTPException(status_code=400, detail='Email already registered')
    return UserOut(id=user.id, name=user.name, email=user.email)
@router.post('/login')
def login(payload: UserLogin, db: Session = Depends(get_db)):
    token = login_user(db, payload.email, payload.password)
    if not token: raise HTTPException(status_code=401, detail='Invalid credentials')
    return {'access_token': token, 'token_type': 'bearer'}
