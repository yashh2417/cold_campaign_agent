from sqlalchemy import select, func, text
from app.models.call_table import (
    Call,
    Campaign,
    Contact,
    User
)
import uuid
from app.models.call_table import Campaign
from sqlalchemy import desc

def get_campaign_by_batch_id(batch_id: str, db):
    """
    Retrieves a campaign from the database by its unique batch_id.
    """
    return db.query(Campaign).filter(Campaign.batch_id == batch_id).first()

def get_campaign_by_thread_id(campaign_thread_id: str, db):
    """
    Retrieves the active campaign from the database by its unique campaign_thread_id.
    """
    # Add a filter to ensure you only get the currently active campaign
    return db.query(Campaign).filter(
        Campaign.campaign_thread_id == campaign_thread_id,
        Campaign.campaign_status == 'Active'
    ).first()

def get_call_by_batch_and_contact(db, batch_id: str, contact_id: int):
    """Finds a call within a specific batch for a given contact."""
    return db.query(Call).filter(
        Call.batch_id == batch_id,
        Call.contact_id == contact_id
    ).first()

def get_userdata_by_userID(user_id,db):
    return db.execute(
        select(User.name,
               User.phone_number,
               User.email,
               User.company)
            .where(User.user_id == user_id)
        ).fetchone()

def campaigns_by_userID(user_id,db):
    """
    Retrieves only the most recent version of each campaign for a user,
    based on the latest start_date for each unique campaign_thread_id.
    """
    # Subquery to find the latest campaign for each thread
    latest_campaigns_subquery = (
        select(
            Campaign.campaign_id
        )
        .distinct(Campaign.campaign_thread_id)
        .where(Campaign.user_id == user_id)
        .order_by(Campaign.campaign_thread_id, desc(Campaign.start_date))
    ).alias("latest_campaigns")

    # Main query to fetch the full campaign objects
    return db.query(Campaign).filter(
        Campaign.campaign_id.in_(select(latest_campaigns_subquery.c.campaign_id))
    ).all()

def get_number_of_calls_from_campaignID(campaign_thread_ID,db):
    return db.execute(
        select(func.count(Call.call_id))
        .where(Call.campaign_thread_id == campaign_thread_ID)
    ).scalars().all()

def get_contacts_from_campaign_id(campaign_thread_id,db):
    # Get the most recent campaign version based on the start_date
    campaign = db.query(Campaign).filter(
        Campaign.campaign_thread_id == campaign_thread_id
    ).order_by(desc(Campaign.start_date)).first()

    if campaign and campaign.contact_ids:
        return db.query(Contact).filter(Contact.contact_id.in_(campaign.contact_ids)).all()
    return []


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

def get_active_calls_by_batch_id(batch_id, db, user_id):
    """
    Gets only the ACTIVE calls for a batch, filtering out any that have been
    toggled off by the user.
    """
    return db.execute(
        select(Call).where(
            Call.batch_id == batch_id,
            Call.is_active_for_campaign == True,
            Call.user_id == user_id
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

    contact = get_contact_by_phone_number(db, phone_number, user_id)
    if not contact:
        return uuid.uuid4()

    previous_call = db.query(Call).filter(
        Call.campaign_thread_id == campaign_thread_id,
        Call.contact_id == contact.contact_id
    ).first()

    if previous_call:
        return previous_call.call_thread_id
    else:
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

    if metadata.get("is_change") == "true" and metadata.get("campaign_thread_id"):
        return metadata["campaign_thread_id"]

    batch_id = data.get("batch_id")
    if batch_id:
        existing_campaign = get_campaign_by_batch_id(batch_id, db)
        if existing_campaign:
            return existing_campaign.campaign_thread_id

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
        ct.name as contact_name,
        ct.contact_id as contact_id
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

    call_history_grouped = defaultdict(lambda: {'contact_id': None, 'calls': []})

    for row in results:
        contact_name = row.contact_name
        call_history_grouped[contact_name]['contact_id'] = row.contact_id
        
        call_data = {
            "call_thread_id": str(row.call_thread_id),
            "call_date_time": row.created_at.strftime("%d/%m/%y, %I:%M%p"),
            "call_type": f"Outbound ({row.to_phone})" if row.status == 'completed' else row.status.replace('_',
                                                                                                           ' ').title(),
            "call_duration": row.call_duration or "N/A",
            "call_stage": row.emotion.title() if row.emotion else "N/A",
            "recording_url": row.recording_url
        }
        call_history_grouped[contact_name]['calls'].append(call_data)

    final_response = {
        "call_history": [
            {
                "contact_name": name,
                "contact_id": data['contact_id'],
                "calls": data['calls']
            }
            for name, data in call_history_grouped.items()
        ]
    }

    return final_response

def get_call_by_batch_and_contact(db, batch_id: str, contact_id: int):
    """Finds a call within a specific batch for a given contact."""
    return db.query(Call).filter(
        Call.batch_id == batch_id,
        Call.contact_id == contact_id
    ).first()

def get_contacts_for_userID(user_id,db):
    return db.execute(
        select(Contact).
        where(Contact.user_id == user_id, Contact.is_active == True)
        ).scalars().all()

def get_recording_url(call_id, db, user_id):
    return db.execute(
        select(Call.recording_url)
        .where(
            Call.call_id == call_id,
            Call.user_id == user_id
            )
    ).scalar()