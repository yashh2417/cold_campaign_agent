from sqlalchemy import select, func, text
from app.models.call_table import (
    Call,
    Campaign,
    Contact,
    User
)
import uuid


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

def get_call_thread_id(db,data):
    metadata = data.get("metadata",{})
    if metadata:
        if metadata.get("is_followup",False) and metadata.get("followup_to_call_id",None):
            # Fetch the thread ID from the original call
            original_call = db.query(Call).filter(Call.call_id == metadata.get("followup_to_call_id")).first()
            if not original_call:
                raise ValueError("Original call for follow-up not found.")
            thread_id = original_call.call_thread_id
        else:
            print('else')
            # Create a new thread ID for the initial call
            thread_id = uuid.uuid4()
    else:
        # Create a new thread ID for the initial call
        print('Main-else')
        thread_id = uuid.uuid4()
    return thread_id

def get_campaign_thread_id(data):
    metadata = data.get("metadata",{})
    if metadata:
        if metadata.get("is_change",False):
            # Fetch the thread ID from the original call
            campaign_thread_id = eval(metadata.get('changes')).get("campaign_thread_id")
        else:
            print('else')
            # Create a new thread ID for the initial call
            campaign_thread_id = uuid.uuid4()
    else:
        # Create a new thread ID for the initial call
        print('Main-else')
        campaign_thread_id = uuid.uuid4()
    return campaign_thread_id

def get_calls_by_userID(user_id,db):
    return db.execute(select(Call).where(Call.user_id == user_id))

# def get_calls_data_from_userID(campaign_thread_id,user_id,db):

#     query = f"""
#     SELECT 
#     calls.call_thread_id,
#     calls.created_at,
#     calls.user_id,
#     calls.from_phone,
#     calls.emotion,
#     calls.recording,
#     calls.campaign_thread_id,
#     contacts.contact_id,
#     contacts.name
# FROM calls
# JOIN contacts ON calls.contact_id = contacts.contact_id
# WHERE calls.user_id = {user_id} 
#   AND calls.campaign_thread_id = '{campaign_thread_id}'
# ORDER BY calls.created_at DESC, calls.call_thread_id;

#     """
#     results =[list(i) for i in db.execute(text(query)).fetchall()]
    
#     return results

# In app/crud/get_data.py

from sqlalchemy import text
from collections import defaultdict

def get_calls_data_from_userID(campaign_thread_id, user_id, db):
    """
    Retrieves and formats call history for a specific user and campaign,
    grouping calls by contact.
    """
    # 1. Modified SQL query to fetch all required columns
    query = f"""
    SELECT
        c.call_thread_id,
        c.created_at,
        c.status,
        c.emotion,
        c.recording_url,
        c.to_phone,
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

    # Execute the query
    results = db.execute(text(query), {
        "user_id": user_id,
        "campaign_thread_id": campaign_thread_id
    }).fetchall()

    # 2. Process results into a structured dictionary
    # defaultdict simplifies grouping
    call_history_grouped = defaultdict(list)

    for row in results:
        # Map the row to a dictionary for easier access
        call_data = {
            "call_thread_id": str(row.call_thread_id),
            "call_date_time": row.created_at.strftime("%d/%m/%y, %I:%M%p"), # e.g., "26/06/25, 12:00PM"
            "call_type": f"Outbound ({row.to_phone})" if row.status == 'completed' else row.status.replace('_', ' ').title(),
            "call_duration": row.call_duration or "N/A",
            "call_stage": row.emotion.title() if row.emotion else "N/A",
            "recording_url": row.recording_url
        }
        call_history_grouped[row.contact_name].append(call_data)

    # 3. Convert the grouped dictionary to the final JSON list format
    final_response = {
        "call_history": [
            {
                "contact_name": name,
                "calls": calls
            }
            for name, calls in call_history_grouped.items()
        ]
    }

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