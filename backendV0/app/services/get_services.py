from app.crud.get_data import (
    get_all_calls,
    get_call_by_id,
    get_contacts_for_userID
    )
from app.crud.get_data import (
    campaigns_by_userID,
    get_number_of_calls_from_campaignID,
    get_contacts_from_campaign_id,
    get_calls_data_from_userID,
    get_recording_url
)
from datetime import datetime, timezone
from app.schemas.campaign import (
    CampaignRead,
    CampaignScreenTable
)
from app.schemas.contacts import (
    ContactScreenTable,
    AddContactCampaignTable,
    ContactDetails 
)
from app.schemas.call import CallRead
from app.crud.update import deactivate_expired_campaigns

from app.core.database import logger
from app.core.config import settings

import requests
from fastapi import HTTPException,Response

async def get_call_from_id(call_id, db, user_id):
    call = get_call_by_id(db=db, call_id=call_id)
    if call is None:
        raise HTTPException(status_code=404, detail="Call not found")
    # Verify the call belongs to the user
    if call.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    data = CallRead.model_validate(call)
    return {"call": data}


async def get_calls_from_db(limit, skip,db):
    """Get all calls from database"""
    try:
        calls = get_all_calls(db)
        calls_serialized = [CallRead.model_validate(call) for call in calls]
        
        return {"calls": calls_serialized, "count": len(calls_serialized)}
    
    
    except Exception as e:
        logger.error(f"❌ Error fetching calls: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch calls")
    
def get_call_recording_by_id(call_id, db, user_id):
    recording_url = get_recording_url(call_id, db, user_id)
    # Handle the case where the recording is not found
    if not recording_url:
        raise HTTPException(status_code=404, detail="Recording not found for this call.")
        
    return {'recording_url': recording_url}


async def campaigns_of_userID(user_id, db):
    # First, update the status of any expired campaigns in the database
    deactivate_expired_campaigns(db)

    # Now, fetch the campaigns with their updated statuses
    campaigns_from_db = campaigns_by_userID(user_id, db)
    processed_campaigns = []
    for campaign in campaigns_from_db:
        campaign_dict = (CampaignRead.model_validate(campaign)).model_dump()
        
        # This logic now correctly reflects the database status
        db_status = getattr(campaign, 'campaign_status', 'Inactive')
        if db_status == 'Active':
            campaign_dict["campaign_status"] = "Active Campaign"
        else:
            campaign_dict["campaign_status"] = "Inactive Campaign"
        
        if campaign.contact_ids:
            campaign_dict['connected_contacts'] = len(campaign.contact_ids)
        else:
            campaign_dict['connected_contacts'] = 0
        
        campaign_dict["campaign_thread_id"] = str(campaign.campaign_thread_id)
        
        processed_campaigns.append(CampaignScreenTable.model_validate(campaign_dict).model_dump())
        
    return {'campaigns': processed_campaigns}

async def contacts_of_campaigns(campaign_thread_id, db):
    contacts = get_contacts_from_campaign_id(campaign_thread_id, db)
    contacts = [(ContactDetails.model_validate(contact)).model_dump() for contact in contacts]
    return {'contacts': contacts} 

async def campaign_add_contacts(campaign_thread_id,db):
    contacts =  get_contacts_from_campaign_id(campaign_thread_id,db)
    print(contacts)
    for i in contacts:
        print(i.name)
    contacts = [(AddContactCampaignTable.model_validate(contact)).model_dump() for contact in contacts]
    print(contacts)
    return {'contacts':contacts}

def call_history_from_userID(campaign_thread_id,user_id,db):
    return get_calls_data_from_userID(campaign_thread_id, user_id, db)

def get_all_contacts(user_id, db):
    contacts_lst = []
    contacts = get_contacts_for_userID(user_id, db)
    for contact in contacts:
        contacts_lst.append(AddContactCampaignTable.model_validate(contact).model_dump())
    return {"contacts": contacts_lst} 