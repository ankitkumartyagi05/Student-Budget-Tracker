from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
class Settlement(Base):
    __tablename__='settlements'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    shared_expense_id: Mapped[str] = mapped_column(String(64), index=True)
    payer: Mapped[str] = mapped_column(String(120))
    receiver: Mapped[str] = mapped_column(String(120))
    amount: Mapped[float] = mapped_column(Float)
