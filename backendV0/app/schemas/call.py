
from pydantic import BaseModel, field_validator, Field, model_validator, ConfigDict
from typing import List, Optional, Dict, Any
import re
from datetime import datetime
from sentence_transformers import SentenceTransformer
from datetime import datetime,timezone,timedelta
from uuid import UUID
# from sentence_transformers import SentenceTransformer
from app.core.config import settings

# embedder = SentenceTransformer("BAAI/bge-large-en-v1.5")



class TestCallForm(BaseModel):
    business_name: str
    business_description: str
    business_website: Optional[str] = None
    campaign_name: str
    agent_name: str
    agent_voice: str
    language: str
    agent_role: str
    task: str
    voicemail_message: Optional[str] = None
    call_recording: bool
    voicemail_setting: bool

    @model_validator(mode="after")
    def check_voicemail_fields(self):
        if self.voicemail_setting and not self.voicemail_message:
            raise ValueError("voicemail_message is required when voicemail_setting is True")
        return self

class RequestData(BaseModel):
    agent_name:Optional[str] = "maya"
    agent_role:str
    business_name:str
    business_description:str
    task_description:str
    customer_name:str
    cust_email:str

class VoiceMail(BaseModel):
    message:Optional[str] = ""
    action:Optional[str] = "hangup"

class GlobalBatch(BaseModel):
    language:Optional[str] = "en"
    start_time:Optional[datetime] = datetime.now(timezone.utc) +timedelta(minutes=30)
    task:Optional[str]=None
    record:Optional[bool] = True
    webhook: Optional[str] = settings.WEBHOOK_URL
    voicemail:Optional[VoiceMail] = VoiceMail()
    interruption_threshold: Optional[int] = 100 
  
    
class BatchCallItemRequest(BaseModel):
    phone_number: str
    ivr_mode: Optional[bool] = True
    voice_id: Optional[int] = 0
    reduce_latency: Optional[bool] = True
    request_data: Optional[RequestData] = {}
    metadata: Optional[Dict[str, str]] = {}
    

class BatchCallRequest(BaseModel):
    call_objects: List[BatchCallItemRequest]
    global_keyword: GlobalBatch = Field(..., alias="global")
    model_config = ConfigDict(populate_by_name=True)


class CallBase(BaseModel):
  batch_id: Optional[str] = None
  scheduled_call_datetime: Optional[datetime]=None
  timezone: Optional[str]=None
  is_call_scheduled: Optional[bool]=None
  emotion: Optional[str] =None
  from_phone: Optional[str]=None
  to_phone: Optional[str]=None
  status: Optional[str]=None
  summary: Optional[str]=None
  call_transcript: Optional[str]=None

  model_config = ConfigDict(from_attributes=True) 

class CallCreate(CallBase):
    call_id: Optional[str] = None
    call_thread_id: UUID
    user_id:int
    contact_id:int
    campaign_thread_id:Optional[str] =None
    batch_id: Optional[str] = None
    pathway_id: Optional[str] = None
    followup_to_call_id: Optional[str] = None

    task:Optional[str]
    is_followup: bool = False   
    created_at:Optional[datetime]
    webhook: Optional[str] = settings.WEBHOOK_URL
    # embedding: Optional[list[float]]=None 
    recording:Optional[bool] = True

    model_config = ConfigDict(extra='allow')

    # @model_validator(mode='after')
    # def generate_embedding(self) -> 'CallCreate':
    #     if self.call_transcript and self.embedding is None:
    #         self.embedding = embedder.encode(self.call_transcript).tolist()
    #     return self

class CallRead(CallBase):
    call_id: str
    created_at: Optional[datetime]
    scheduled_call_datetime: Optional[datetime]
    task:Optional[str]
    
    model_config = ConfigDict(from_attributes=True) 

class SendCallRequest(BaseModel):
    ivr_mode: Optional[bool] = True
    reduce_latency: Optional[bool] = True

    language:Optional[str] = "en"

    request_data: Optional[RequestData] = {}
    metadata: Optional[Dict[str, str]] = {}
    task:Optional[str]=None

    to_phone: str

    start_time:Optional[datetime] = None

    voicemail:Optional[VoiceMail] = VoiceMail()
    record:Optional[bool] = True
    webhook:Optional[str] =settings.WEBHOOK_URL
    interruption_threshold: Optional[int] = 100 
    @field_validator('to_phone')
    def validate_phone_number(cls, v):
        # Basic phone number validation
        if not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v

    
    @field_validator("metadata", mode="before")
    def clean_metadata(cls, v):
        if isinstance(v, dict):
            return v
        return None  
    model_config = ConfigDict(from_attributes=True) 
