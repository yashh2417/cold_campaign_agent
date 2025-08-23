from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.contacts import CreateContactTable, EditContactForm, CreateContact, ToggleContacts
from app.services.create import create_new_contact
from app.services.edit import contact_edit
from app.services.get_services import get_all_contacts
from app.services.stop_delete import delete_contact, toggle_contacts
from app.core.dependencies import (
    get_db,
    get_current_user,
    create_response,
    create_response_with_status
)

router = APIRouter(tags=["contacts"])

@router.post("/contact/create")
def create_contact(contact_data: CreateContact, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = create_new_contact(user.user_id, contact_data, db)
    return create_response_with_status(data, user.user_id, "success", "Contact created successfully")

@router.get("/contact/all")
def get_contacts(user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = get_all_contacts(user.user_id, db)
    return create_response(data, user.user_id)

@router.put("/contact/{contact_id}/edit")
def edit_contact(contact_id: int, contact_data: EditContactForm, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = contact_edit(user.user_id, contact_id, contact_data, db)
    return create_response_with_status(data, user.user_id, "success", "Contact updated successfully")

@router.delete("/contact/{contact_id}")
def remove_contact(contact_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = delete_contact(contact_id, db)
    return create_response_with_status(data, user.user_id, "success", "Contact deleted successfully")

# @router.post("/contact/remove-toggled")   
# def remove_toggled_contacts_endpoint(data, user=Depends(get_current_user), db: Session = Depends(get_db)):
#     result = remove_toggled_contacts(data, user.user_id, db)
#     return create_response_with_status(result, user.user_id, "success", "Contacts updated successfully")

@router.post("/contact/toggle") #n
def toggle_contacts_endpoint(data: ToggleContacts, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = toggle_contacts(data, user.user_id, db)
    return create_response_with_status(result, user.user_id, "success", "Contacts updated successfully")