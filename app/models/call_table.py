from sqlalchemy import Column, String, Integer, Date, Text, DateTime,Boolean,TIMESTAMP
from sqlalchemy.dialects.postgresql import VARCHAR, TEXT, BOOLEAN, TIMESTAMP as PGTIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import VARCHAR, TEXT
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Call(Base):
    __tablename__ = "calls"
    __table_args__ = {"schema": "public"}

    call_thread_id = Column(UUID(as_uuid=True), nullable=True, default=uuid.uuid4)
    call_id = Column(String(255), primary_key=True, nullable=False)
    is_followup = Column(Boolean, default=False, nullable=False)
    followup_to_call_id = Column(String(255), nullable=True)
    pathway_id = Column(String, nullable=True)
    batch_id = Column(String(255), nullable=True)
    emotion = Column(String(20), nullable=True)
    from_phone = Column(String(50), nullable=True)
    to_phone = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(50), nullable=True)
    scheduled_call_datetime = Column(TIMESTAMP(timezone=True), nullable=True)
    timezone = Column(String, nullable=True)
    is_call_scheduled = Column(Boolean, nullable=False, server_default='false')
    summary = Column(Text, nullable=True)
    call_transcript = Column(Text, nullable=True)
    embedding = Column(Vector(1024), nullable=True)  
    task = Column(Text,nullable=True)
    webhook = Column(Text, nullable=True,default="https://bb109896dc71.ngrok-free.app/bland/postcall")
    campaign_thread_id = Column(UUID(as_uuid=True),default=uuid.uuid4,nullable=False)
    contact_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer,nullable=True)
    recording = Column(Boolean,nullable=False,default=True)
    recording_url = Column(Text,nullable=True)
    is_active_for_campaign = Column(Boolean,nullable=True,default=True)

class Campaign(Base):
    __tablename__ = 'campaigns'

    user_id = Column(Integer,nullable=True)
    campaign_id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(100), nullable=False)
    campaign_thread_id = Column(UUID(as_uuid=True), nullable=True, server_default=func.uuid_generate_v4())
    
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    task = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True, server_default=func.now())
    
    agent_name = Column(String(255), nullable=True)
    agent_voice = Column(String(255), nullable=True)
    agent_role = Column(String(255), nullable=True)
    language = Column(String(100), nullable=True)
    
    call_recording = Column(Boolean, nullable=True)
    
    voicemail_message = Column(Text, nullable=True)
    voicemail_setting = Column(Boolean, nullable=True)
    
    campaign_phone_number = Column(String(15),nullable=True)
    campaign_name = Column(String(255), nullable=False)
    business_name = Column(String(255), nullable=True)
    business_description = Column(Text, nullable=True)
    business_website = Column(String(255), nullable=True)

class Contact(Base):
    __tablename__ = 'contacts'

    contact_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    phone_number = Column(String(15), nullable=True)
    company_name = Column(String(255), nullable=True)
    tags = Column(Text, nullable=True)
    user_id = Column(Integer,nullable=True)
    is_active = Column(Boolean, nullable = False, default=True)
    


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    company = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)