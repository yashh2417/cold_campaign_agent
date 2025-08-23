
from pydantic import BaseModel,ConfigDict,model_validator,Field
from typing import Optional,Dict,List,Any
from datetime import datetime
from uuid import UUID

class CreateCampaignForm(BaseModel):
    business_name: str
    business_description: str
    business_website: Optional[str] = None
    campaign_name: str
    agent_name: str
    agent_voice: str
    language: str
    agent_role: str
    task: str
    campaign_start_date: Optional[datetime] = None
    campaign_end_date: Optional[datetime] = None
    voicemail_message: Optional[str] = None
    call_recording: bool
    voicemail_setting: bool

    @model_validator(mode="after")
    def check_voicemail_fields(self):
        if self.voicemail_setting and not self.voicemail_message:
            raise ValueError("voicemail_message is required when voicemail_setting is True")
        return self
    
class CreateCampaignFormMain(BaseModel):
    form_data:CreateCampaignForm
    contacts:List[int]

class EditCampaignForm(CreateCampaignForm):
    pass

class EditCampaign(BaseModel):
    name:Optional[str]
    task:Optional[str]
    start_date:Optional[str]
    end_date:Optional[str]
    voicemail:Optional[str]

class CampaignItemPayload(BaseModel):
    contact_id:int
    ivr_mode:Optional[bool] =True
    voice_id:Optional[int] = 0
    reduce_latency:Optional[bool] = True
    request_data:Optional[Dict[str,str]] = {}
    metadata:Optional[Dict[str,str]] = {}
    to_phone:str

    model_config = ConfigDict(from_attributes=True)

class CampaignReadPayload(BaseModel):
    contact_id:int
    ivr_mode:Optional[bool] =True
    voice_id:Optional[int] = 0
    reduce_latency:Optional[bool] = True
    to_phone:str

    model_config = ConfigDict(from_attributes=True)



class CreateCampaignTable(BaseModel):
    user_id: Optional[int]
    batch_id: str
    campaign_thread_id: Optional[str] = None
    
    start_date: datetime
    end_date: datetime

    task: Optional[str]
    
    agent_role: Optional[str]
    agent_name: Optional[str]
    agent_voice: Optional[str]
    language: Optional[str]

    voicemail_message: Optional[str]
    call_recording: Optional[bool]
    voicemail_setting: Optional[bool]

    campaign_phone_number: Optional[str]

    campaign_name: str
    business_name: Optional[str]
    business_description: Optional[str]
    business_website: Optional[str]

    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CampaignRead(BaseModel):
    campaign_id: int
    campaign_name: str
    batch_id: str
    start_date: datetime
    end_date: datetime
    task: Optional[str] = None
    agent_name: Optional[str] = None
    created_at: Optional[datetime] = None
    campaign_thread_id: Optional[UUID] = None
    agent_voice: Optional[str] = None
    language: Optional[str] = None
    agent_role: Optional[str] = None
    voicemail_message: Optional[str] = None
    call_recording: Optional[bool] = None
    voicemail_setting: Optional[bool] = None
    user_id: Optional[int] = None
    campaign_phone_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CampaignScreenTable(BaseModel):
    batch_id:str
    campaign_thread_id: str
    campaign_name: str
    agent_name: str
    # campaign_phone_number: str
    campaign_phone_number: Optional[str] = None
    start_date: datetime
    end_date: datetime
    channels_enabled:Optional[str] = "Call"
    campaign_status:Optional[str] = "Active"
    connected_contacts:int

    model_config = ConfigDict(from_attributes=True)

class CreateCampaignPayload(BaseModel):
    global_keywords:Dict[str,Any] = Field(...,alias = "global")
    call_objects:List[Dict[str,str]]
