from app.models.call_table import User
from app.utils.auth_utils import (
    hash_password,
    verify_password,
    create_access_token
)

def user_exists(user_data,db):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        return True
    return False
    
def add_user(user_data,db):
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        name = user_data.name,
        company = user_data.company,
        phone_number = user_data.phone_number
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
    
def oauth2_user_exists(form_data,db):
    return db.query(User).filter(User.email == form_data.username).first()