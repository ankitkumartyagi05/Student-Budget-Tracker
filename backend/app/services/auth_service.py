from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.utils.security import create_access_token, hash_password, verify_password
def register_user(db: Session, payload: UserCreate):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        return None
    user = User(id=payload.id, name=payload.name, email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user); db.commit(); return user
def login_user(db: Session, email: str, password: str) -> str | None:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return create_access_token(user.id)
