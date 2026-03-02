from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
class Budget(Base):
    __tablename__='budgets'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    month: Mapped[str] = mapped_column(String(16), index=True)
    category: Mapped[str] = mapped_column(String(120), index=True)
    monthly_limit: Mapped[float] = mapped_column(Float)
