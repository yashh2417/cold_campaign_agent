from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.campaign import (
    EditCampaignForm,
    CreateCampaignFormMain
)
from app.crud.update import update_campaign_status_by_batch_id
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
    get_current_user,
    create_response,
    create_response_with_status
)
from typing import List

router = APIRouter(tags=["campaigns"])

@router.get('/campaign/active')
async def get_active_campaigns_by_userID(user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = await campaigns_of_userID(user.user_id, db)
    return create_response(data, user.user_id)

@router.get('/campaign/{campaign_thread_id}/contact-list')
async def get_campaign_contacts(campaign_thread_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = await contacts_of_campaigns(campaign_thread_id, db)
    return create_response(data, user.user_id)

@router.post('/campaign/create')
async def create_campaign(data: CreateCampaignFormMain, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = await create_campaign_batch(user.user_id, data, db)
    return create_response_with_status(result, user.user_id, "success", "Campaign created successfully")

@router.put("/campaign/{batch_id}/edit")
async def editCampaign(data: EditCampaignForm, batch_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = await changeCampaign(user.user_id, batch_id, data, db)
    return create_response_with_status(result, user.user_id, "success", "Campaign updated successfully")

@router.delete('/campaign/{batch_id}/stop')
def stop_campaign(batch_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = stop_batch_calls(batch_id)
    update_campaign_status_by_batch_id(db, batch_id, "inactive")
    return create_response_with_status(data, user.user_id, "success", f"Campaign {batch_id} stopped successfully")