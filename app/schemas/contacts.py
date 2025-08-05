from pydantic import Field, EmailStr,ConfigDict, BaseModel, field_validator,  model_validator, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class CreateContactTable(BaseModel):
  contact_id:int
  contact_name:str = Field(alias ="name")
  email:str
  phone_number:str
  company_name:Optional[str] = None
  tags:Optional[str] = None
  user_id:Optional[int] = None

  model_config = ConfigDict(from_attributes=True)

class EditContactForm(BaseModel):
  contact_name:str = Field(default=None,alias ="name")
  email:str = None
  phone_number:str = None
  company_name:Optional[str] = None
  tags:Optional[str] = None

  model_config = ConfigDict(from_attributes=True)

class CreateContact(BaseModel):
  contact_name:str = Field(alias ="name")
  email:str
  phone_number:str
  company_name:Optional[str] = None
  tags:Optional[str] = None

  model_config = ConfigDict(from_attributes=True)

class ContactScreenTable(BaseModel):
  contact_name: str = Field(alias="name")
  phone_number: str 
  company_name: Optional[str] = "EICE"
  email_address:str = Field(alias="email")
  tags: Optional[str] = "Tech"

  model_config = ConfigDict(from_attributes=True,populate_by_name=True)

class AddContactCampaignTable(ContactScreenTable):
   contact_id: int