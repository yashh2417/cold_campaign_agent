from sqlalchemy import select, insert, update
from app.schemas.call import CallCreate
from app.models.call_table import (
    Call,
    User,
    Contact,
    Campaign
)

def create_call(db, call: CallCreate):
    db_call = Call(**call.model_dump())
    db.add(db_call)
    db.commit()
    db.refresh(db_call) 
    return db_call

def create_campaign(campaign_data,db):
    db_campaign = Campaign(**campaign_data.model_dump())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign) 
    return db_campaign


def create_new_contact_db(user_id,contact_data,db):
    contact = Contact(name=contact_data.contact_name,
                      email = contact_data.email,
                      phone_number = contact_data.phone_number,
                      company_name = contact_data.company_name,
                      tags = contact_data.tags,
                      user_id = user_id)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact