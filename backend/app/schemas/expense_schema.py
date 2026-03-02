from pydantic import BaseModel, Field
class SharedParticipantIn(BaseModel):
    name: str
    share: float = Field(ge=0)
class ExpenseIn(BaseModel):
    id: str
    amount: float = Field(gt=0)
    category: str
    date: str
    notes: str | None = None
    isShared: bool = False
class ExpenseOut(BaseModel):
    id: str
    amount: float
    category: str
    date: str
    notes: str | None
    isShared: bool
class SharedExpenseIn(BaseModel):
    id: str
    description: str
    totalAmount: float = Field(gt=0)
    paidBy: str
    participants: list[SharedParticipantIn]
    date: str
class SharedExpenseStatusUpdate(BaseModel):
    isSettled: bool
class SharedExpenseOut(BaseModel):
    id: str
    description: str
    totalAmount: float
    paidBy: str
    participants: list[SharedParticipantIn]
    date: str
    isSettled: bool
