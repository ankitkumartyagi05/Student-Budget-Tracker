from sqlalchemy import Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
class Expense(Base):
    __tablename__='expenses'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(120), index=True)
    date: Mapped[str] = mapped_column(String(32), index=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)
