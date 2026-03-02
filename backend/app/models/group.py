from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
class Group(Base):
    __tablename__='groups'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    owner_user_id: Mapped[str] = mapped_column(String(64), index=True)
