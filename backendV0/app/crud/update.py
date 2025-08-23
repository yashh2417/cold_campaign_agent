from sqlalchemy import select, insert, update
from sqlalchemy.orm.attributes import flag_modified
from app.models.call_table import (
    User,
    Contact,
    Campaign,
    Call
)
from app.crud.get_data import get_campaign_by_thread_id
from datetime import datetime, timezone


def update_contact_db(contact_id,contact_data,db):
    if contact_data.get('contact_name',False):
        contact_data['name'] = contact_data['contact_name']
        contact_data.pop('contact_name')
        
    stmnt = (
        update(Contact)
        .where(Contact.contact_id == contact_id)
        .values(**contact_data)
    )
    db.execute(stmnt)
    db.commit()

def update_campaign_status_by_batch_id(db, batch_id: str, new_status: str):
    stmt = (
        update(Campaign)
        .where(Campaign.batch_id == batch_id)
        .values(campaign_status=new_status)
    )
    db.execute(stmt)
    db.commit()

def update_campaign_with_batch_id(db, campaign_id: int, batch_id: str):
    stmt = (
        update(Campaign)
        .where(Campaign.campaign_id == campaign_id)
        .values(batch_id=batch_id)
    )
    db.execute(stmt)
    db.commit()
    
def soft_delete_contact_for_user(contact_id,db):
    stmnt = (
        update(Contact)
        .where(Contact.contact_id == contact_id)
        .values(is_active = False)
    )
    db.execute(stmnt)
    db.commit()

def deactivate_expired_campaigns(db):
    """Finds and deactivates all campaigns that have passed their end date."""
    now_utc = datetime.now(timezone.utc)
    stmt = (
        update(Campaign)
        .where(Campaign.end_date < now_utc, Campaign.campaign_status == 'Active')
        .values(campaign_status='Inactive')
    )
    db.execute(stmt)
    db.commit()

def update_call_with_id(db, existing_call_id: int, new_call_id: str, new_call_thread_id: str):
    """Updates a placeholder call record with the real call_id and call_thread_id."""
    stmt = (
        update(Call)
        .where(Call.id == existing_call_id)
        .values(call_id=new_call_id, call_thread_id=new_call_thread_id)
    )
    db.execute(stmt)
    db.commit()

def remove_contact_from_campaign(db, campaign_thread_id: str, contact_id: int):
    campaign = get_campaign_by_thread_id(campaign_thread_id, db)
    if campaign and contact_id in campaign.contact_ids:
        # Create a new list without the contact_id to ensure the change is detected
        new_contact_ids = list(campaign.contact_ids)
        new_contact_ids.remove(contact_id)
        campaign.contact_ids = new_contact_ids
        flag_modified(campaign, "contact_ids")
        db.commit()
        db.refresh(campaign)

def add_contact_to_campaign(db, campaign_thread_id: str, contact_id: int):
    campaign = get_campaign_by_thread_id(campaign_thread_id, db)
    if campaign:
        # Initialize the list if it's None, then add the new contact
        current_contact_ids = campaign.contact_ids or []
        if contact_id not in current_contact_ids:
            new_contact_ids = list(current_contact_ids) + [contact_id]
            campaign.contact_ids = new_contact_ids
            flag_modified(campaign, "contact_ids")
            db.commit()
            db.refresh(campaign)