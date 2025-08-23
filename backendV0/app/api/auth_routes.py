from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.core.database import get_db
from app.models.call_table import User
from app.utils.auth_utils import (
    hash_password,
    verify_password,
    create_access_token
)
from app.schemas.auth import (
    UserCreate,
    UserRead,
    Token
)
from app.core.database import get_db
from app.crud.auth_db import (
    user_exists,
    add_user,
    oauth2_user_exists
    )


router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserRead)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = user_exists(user_data,db)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = add_user(user_data=user_data,db=db)
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = oauth2_user_exists(form_data,db)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": str(user.user_id)})
    return {"access_token": token, "token_type": "bearer", "user_id": user.user_id}