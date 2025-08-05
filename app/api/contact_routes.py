from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_db
)

from app.schemas.contacts import (
    CreateContact
)
from app.schemas.contacts import (
    EditContactForm
)

from app.services.create import (
    create_new_contact
)
from app.services.edit import (
    contact_edit
)
from app.services.stop_delete import (
    delete_contact
)
from app.services.get_services import (
    get_all_contacts
)
router = APIRouter(tags=["contacts"])



@router.get("/contacts/")
def get_contacts(user = Depends(get_current_user),db:Session = Depends(get_db)):
    return get_all_contacts(user.user_id,db)


@router.post("/contacts/create")
def create_contact(contact_data:CreateContact,db:Session = Depends(get_db),user = Depends(get_current_user)):
    return create_new_contact(user.user_id,contact_data,db)


@router.put('/contacts/edit/{contact_id}')
def edit_contact(contact_id:int,contact_data:EditContactForm,db:Session = Depends(get_db),user = Depends(get_current_user)):
    return contact_edit(user.user_id,contact_id,contact_data.model_dump(exclude_none=True),db)


@router.delete('/contacts/delete/{contact_id}')
def delete_contact_by_contactID(contact_id:int,db:Session = Depends(get_db)):
    return delete_contact(contact_id,db)