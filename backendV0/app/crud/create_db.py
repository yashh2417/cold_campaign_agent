from sqlalchemy import select, insert, update
from app.schemas.call import CallCreate
from app.models.call_table import (
    Call,
    User,
    Contact,
    Campaign
)
from fastapi import HTTPException

def create_call(db, call: CallCreate):
    db_call = Call(**call.model_dump())
    # db_call = Call(**call.model_dump(exclude={"call_id", "call_thread_id"}))
    db.add(db_call)
    db.commit()
    db.refresh(db_call) 
    return db_call

def create_campaign(campaign_data, db):
    db_campaign = Campaign(**campaign_data)
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign


def create_new_contact_db(user_id, contact_data, db):
    # Check for an existing contact with the same phone number
    existing_contact = db.query(Contact).filter(
        Contact.phone_number == contact_data.phone_number,
        Contact.user_id == user_id
    ).first()

    if existing_contact:
        if existing_contact.is_active:
            raise HTTPException(status_code=409, detail="An active contact with this phone number already exists.")

        # Reactivate and update the existing contact
        existing_contact.is_active = True
        existing_contact.name = contact_data.contact_name
        existing_contact.email = contact_data.email
        existing_contact.company_name = contact_data.company_name
        existing_contact.tags = contact_data.tags
        
        db.commit()
        db.refresh(existing_contact)
        return existing_contact

    # If no existing contact was found, create a new one.
    new_contact = Contact(
        name=contact_data.contact_name,
        email=contact_data.email,
        phone_number=contact_data.phone_number,
        company_name=contact_data.company_name,
        tags=contact_data.tags,
        user_id=user_id
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact