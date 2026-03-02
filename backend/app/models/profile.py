from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
class Profile(Base):
    __tablename__='profiles'
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    monthly_income: Mapped[str] = mapped_column(String(64), default='0')
