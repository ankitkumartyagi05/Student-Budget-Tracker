from pydantic import BaseModel
class GroupIn(BaseModel):
    id: str
    name: str
    owner_user_id: str
class GroupOut(GroupIn):
    pass
