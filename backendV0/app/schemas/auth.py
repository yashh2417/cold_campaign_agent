from pydantic import BaseModel,Field, EmailStr,ConfigDict
from typing import Optional

class UserCreate(BaseModel):
  email: EmailStr
  password: str = Field(alias="hashed_password")
  name:str
  phone_number:str
  company:Optional[str]

  model_config = ConfigDict(from_attributes=True)

class UserRead(BaseModel):
  user_id: int
  email: EmailStr

  model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user_id: int