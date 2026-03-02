from sqlalchemy import Boolean, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
class SharedExpense(Base):
    __tablename__='shared_expenses'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    description: Mapped[str] = mapped_column(String(255))
    total_amount: Mapped[float] = mapped_column(Float)
    paid_by: Mapped[str] = mapped_column(String(120))
    participants_json: Mapped[str] = mapped_column(Text)
    date: Mapped[str] = mapped_column(String(32))
    is_settled: Mapped[bool] = mapped_column(Boolean, default=False)
class SharedParticipant(Base):
    __tablename__='shared_participants'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    expense_id: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(120))
    share: Mapped[float] = mapped_column(Float)
