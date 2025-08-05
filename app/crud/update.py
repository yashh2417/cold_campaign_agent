
from sqlalchemy import select, insert, update
from app.models.call_table import (
    User,
    Contact,
    Campaign
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
    
def soft_delete_contact(contact_id,db):
    stmnt = (
        update(Contact)
        .where(Contact.contact_id == contact_id)
        .values(is_active = False)
    )
    db.execute(stmnt)
    db.commit()
