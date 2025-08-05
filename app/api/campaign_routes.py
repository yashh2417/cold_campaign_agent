from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.campaign import (
    EditCampaignForm,
    CreateCampaignFormMain
)
from app.services.get_services import (
    campaigns_of_userID,
    contacts_of_campaigns,
    campaign_add_contacts
)

from app.services.edit import (
    changeCampaign
)

from app.services.stop_delete import (
    stop_batch_calls
)

from app.services.create import (
    create_batch_call,
    create_campaign_batch
)
from app.core.dependencies import (
    get_db,
    get_current_user
)
from typing import List
router = APIRouter(tags=["campaigns"])

@router.get('/campaign/active')
async def get_active_campaigns_by_userID(user=Depends(get_current_user),db:Session = Depends(get_db)):
    return await campaigns_of_userID(user.user_id,db)

@router.get('/campaign/{campaign_thread_id}/contact-list')
async def get_campaign_contacts(campaign_thread_id:str,db:Session = Depends(get_db)):
    return await contacts_of_campaigns(campaign_thread_id,db)

# @router.get('/campaign/{campaign_thread_id}/add-contacts')
# async def add_campaign_contacts(campaign_thread_id:str,db:Session = Depends(get_db)):
#     return await campaign_add_contacts(campaign_thread_id,db)

@router.post('/campaign/create')
async def create_campaign(data:CreateCampaignFormMain,db:Session = Depends(get_db),user=Depends(get_current_user)):
    return await create_campaign_batch(user.user_id,data,db)

@router.put("/campaign/{batch_id}/edit")
async def editCampaign(data:EditCampaignForm,batch_id:str,db:Session = Depends(get_db),user=Depends(get_current_user)):
    return await changeCampaign(user.user_id,batch_id,data,db)

@router.delete('/campaign/{batch_id}/stop')
def stop_campaign(batch_id:str):
    return stop_batch_calls(batch_id)