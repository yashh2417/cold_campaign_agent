from sqlalchemy import select, insert, update
from app.models.call_table import (
    User,
    Contact,
    Campaign,
    Call
)


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
    
def soft_delete_contact_for_user(contact_id,db):
    stmnt = (
        update(Contact)
        .where(Contact.contact_id == contact_id)
        .values(is_active = False)
    )
    db.execute(stmnt)
    db.commit()

def soft_delete_contact_for_campaign(campaign_thread_id,contact_id,user_id,db):
    stmnt = (
        update(Call)
        .where(Call.campaign_thread_id == campaign_thread_id)
        .where(Call.contact_id == contact_id)
        .where(Call.user_id == user_id)
        .values(is_active_for_campaign = False)
    )
    db.execute(stmnt)
    db.commit()