from pydantic import BaseModel, field_validator,  model_validator, ConfigDict
from typing import List, Optional, Dict, Any
import re
from datetime import datetime
# from sentence_transformers import SentenceTransformer
from datetime import datetime,timezone,timedelta
from uuid import UUID

class PromptBusiness(BaseModel):
    business_desc:str
    business_name:str
    product_desc:str
    business_urls:Optional[str]
    business_files:Optional[str]


class TTSRequest(BaseModel):
    text:str
    ai_name:Optional[str] = "Maeve"

class SalesCallResult(BaseModel):
    summary: str
    customer_reaction: str
    next_call_datetime: Optional[datetime]
    timezone: str
    is_call_scheduled: bool
    need_email: bool
    cust_email: Optional[str]