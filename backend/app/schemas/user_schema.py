from pydantic import BaseModel, EmailStr
class UserCreate(BaseModel):
    id: str
    name: str
    email: EmailStr
    password: str
class UserLogin(BaseModel):
    email: EmailStr
    password: str
class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
