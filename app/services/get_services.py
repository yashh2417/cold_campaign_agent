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

from app.schemas.campaign import (
    CampaignRead,
    CampaignScreenTable
)
from app.schemas.contacts import (
    ContactScreenTable,
    AddContactCampaignTable
)
from app.schemas.call import CallRead

from app.core.database import logger
from app.core.config import settings

import requests
from fastapi import HTTPException,Response

async def get_call_from_id(call_id, db):
    call = get_call_by_id(db=db, call_id=call_id)
    if call is None:
        raise HTTPException(status_code=404, detail="Call not found")
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
    

def get_call_recording_by_id(call_id,db):
    recording_url = get_recording_url(call_id,db)
    print(recording_url)
    return {'recording_url':recording_url}


async def campaigns_of_userID(user_id,db):
    campaigns = campaigns_by_userID(user_id,db)
    campaigns = [(CampaignRead.model_validate(campaign)).model_dump() for campaign in campaigns]
    print(campaigns)
    for campaign in campaigns:
        campaign["campaign_thread_id"] = str(campaign["campaign_thread_id"])
        campaign['connected_contacts'] = (get_number_of_calls_from_campaignID(campaign['campaign_thread_id'],db=db))[0]
    campaigns =[(CampaignScreenTable.model_validate(campaign)).model_dump() for campaign in campaigns]
    return {'campaigns':campaigns}

async def contacts_of_campaigns(campaign_thread_id,db):
    contacts =  get_contacts_from_campaign_id(campaign_thread_id,db)
    print(contacts)
    for i in contacts:
        print(i.name)
    contacts = [(ContactScreenTable.model_validate(contact)).model_dump() for contact in contacts]
    print(contacts)
    return {'contacts':contacts}

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


def get_all_contacts(user_id,db):
    contacts_lst = []
    contacts = get_contacts_for_userID(user_id,db)
    for contact in contacts:
        contacts_lst.append(AddContactCampaignTable.model_validate(contact).model_dump())

    return {"contacts":contacts_lst}