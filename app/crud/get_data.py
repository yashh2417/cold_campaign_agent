from sqlalchemy import select, func, text
from app.models.call_table import (
    Call,
    Campaign,
    Contact,
    User
)
import uuid
from app.models.call_table import Campaign

def get_campaign_by_batch_id(batch_id: str, db):
    """
    Retrieves a campaign from the database by its unique batch_id.
    """
    return db.query(Campaign).filter(Campaign.batch_id == batch_id).first()

def get_userdata_by_userID(user_id,db):
    return db.execute(
        select(User.name,
               User.phone_number,
               User.email,
               User.company)
            .where(User.user_id == user_id)
        ).fetchone()

def campaigns_by_userID(user_id,db):
    return db.execute(
        select(Campaign).where(Campaign.user_id == user_id)
        ).scalars().all()

def get_number_of_calls_from_campaignID(campaign_thread_ID,db):
    return db.execute(
        select(func.count(Call.call_id))
        .where(Call.campaign_thread_id == campaign_thread_ID)
    ).scalars().all()

def get_contacts_from_campaign_id(campaign_thread_id,db):
    subquery = select(Call.contact_id).where(Call.campaign_thread_id == campaign_thread_id).where(Call.is_active_for_campaign == True).subquery()
    return db.execute(
        select(Contact).where(Contact.contact_id.in_(subquery))
    ).scalars().all()

def get_contact_from_contactID(contact_id,db):
    return db.execute(
        select(Contact).where(Contact.contact_id == contact_id)
    ).scalar_one()

def get_calls_by_batch_id(batch_id,db):
    return db.execute(select(Call).where(Call.batch_id == batch_id)).scalars().all()

def get_campaign_thread_by_batch_id(batch_id, db):
    return db.execute(
        select(Call.campaign_thread_id).where(Call.batch_id == batch_id)
    ).scalars().all() 

def get_contact_by_contact_id(contact_id,db):
    return db.execute(
        select(Contact).where(Contact.contact_id == contact_id)
    ).scalar_one()

def get_curr_campaign(batch_id,db):
    return db.execute(
        select(Campaign).where(Campaign.batch_id == batch_id)
        ).scalar_one()

def get_scheduled_call(db):
    return db.query(Call).filter(Call.is_call_scheduled == True).all()

def get_all_calls(db):
    return db.query(Call).all()

def get_call_by_id(db, call_id: str):
    return db.query(Call).filter(Call.call_id == call_id).first()

def get_active_calls_by_batch_id(batch_id, db):
    """
    Gets only the ACTIVE calls for a batch, filtering out any that have been
    toggled off by the user.
    """
    return db.execute(
        select(Call).where(
            Call.batch_id == batch_id,
            Call.is_active_for_campaign == True
        )
    ).scalars().all()

def get_contact_by_phone_number(db, phone_number: str, user_id: int):
    """Finds a contact by their phone number for a specific user."""
    return db.query(Contact).filter(
        Contact.phone_number == phone_number,
        Contact.user_id == user_id
    ).first()


def get_call_thread_id(db, campaign_thread_id: str, phone_number: str, user_id: int):
    """
    Gets a consistent call_thread_id by using the phone number to find the correct contact first.
    """
    if not all([campaign_thread_id, phone_number, user_id]):
        return uuid.uuid4()

    # 1. Find the correct contact using the phone number.
    contact = get_contact_by_phone_number(db, phone_number, user_id)
    if not contact:
        # If contact doesn't exist for some reason, generate a new ID.
        return uuid.uuid4()

    # 2. Use the correct contact_id to find a previous call.
    previous_call = db.query(Call).filter(
        Call.campaign_thread_id == campaign_thread_id,
        Call.contact_id == contact.contact_id
    ).first()

    if previous_call:
        # If a call exists, reuse its thread_id.
        return previous_call.call_thread_id
    else:
        # If this is the first call, create a new thread_id.
        return uuid.uuid4()
    
def get_campaign_by_batch_id(batch_id: str, db):
    """Retrieves a campaign from the database by its batch_id."""
    return db.query(Campaign).filter(Campaign.batch_id == batch_id).first()


def get_campaign_thread_id(data, db):
    """
    Gets a consistent campaign_thread_id. It prioritizes the ID from metadata (for edits),
    then checks the DB, and finally creates a new one.
    """
    metadata = data.get("metadata", {})
    
    # Priority 1: Use the ID from metadata if it's an edited campaign
    if metadata.get("is_change") == "true" and metadata.get("campaign_thread_id"):
        return metadata["campaign_thread_id"]

    # Priority 2: Check if a campaign for this batch already exists in the DB
    batch_id = data.get("batch_id")
    if batch_id:
        existing_campaign = get_campaign_by_batch_id(batch_id, db)
        if existing_campaign:
            return existing_campaign.campaign_thread_id
            
    # Priority 3: Generate a new ID if none is found
    return uuid.uuid4()

def get_calls_by_userID(user_id,db):
    return db.execute(select(Call).where(Call.user_id == user_id))

from sqlalchemy import text
from collections import defaultdict

def get_calls_data_from_userID(campaign_thread_id, user_id, db):
    """
    Retrieves and formats call history for a specific user and campaign,
    grouping calls by contact.
    """
    query = f"""
    SELECT
        c.call_thread_id,
        c.created_at,
        c.status,
        c.emotion,
        c.recording_url,
        c.to_phone,
        c.call_duration, 
        ct.name as contact_name
    FROM
        calls c
    JOIN
        contacts ct ON c.contact_id = ct.contact_id
    WHERE
        c.user_id = :user_id
        AND c.campaign_thread_id = :campaign_thread_id
    ORDER BY
        ct.name, c.created_at DESC;
    """

    results = db.execute(text(query), {
        "user_id": user_id,
        "campaign_thread_id": campaign_thread_id
    }).fetchall()

    call_history_grouped = defaultdict(list)

    for row in results:
        call_data = {
            "call_thread_id": str(row.call_thread_id),
            "call_date_time": row.created_at.strftime("%d/%m/%y, %I:%M%p"),
            "call_type": f"Outbound ({row.to_phone})" if row.status == 'completed' else row.status.replace('_',
                                                                                                           ' ').title(),
            "call_duration": row.call_duration or "N/A",
            "call_stage": row.emotion.title() if row.emotion else "N/A",
            "recording_url": row.recording_url
        }
        call_history_grouped[row.contact_name].append(call_data)

    final_response = {
        "call_history": [
            {
                "contact_name": name,
                "calls": calls
            }
            for name, calls in call_history_grouped.items()
        ]
    }
    
    # Return the processed data, not another call to the same function.
    return final_response


def get_contacts_for_userID(user_id,db):
    return db.execute(
        select(Contact).
        where(Contact.user_id == user_id)
        ).scalars().all()

def get_recording_url(call_id,db):
    return db.execute(
        select(Call.recording_url)
        .where(Call.call_id == call_id)
    ).scalar_one()