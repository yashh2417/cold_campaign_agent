from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from app.utils.auth_utils import decode_token
from app.models.call_table import User
from app.core.database import SessionLocal
from pydantic import BaseModel
from typing import Any, Dict

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        user = db.query(User).get(int(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Base response model that includes user_id
class BaseResponse(BaseModel):
    user_id: int
    data: Any
    
class BaseResponseWithStatus(BaseModel):
    user_id: int
    status: str
    data: Any = None
    message: str = None

def create_response(data: Any, user_id: int) -> Dict:
    """Helper function to create standardized responses with user_id"""
    return {
        "user_id": user_id,
        "data": data
    }

def create_response_with_status(data: Any, user_id: int, status: str = "success", message: str = None) -> Dict:
    """Helper function to create standardized responses with user_id and status"""
    response = {
        "user_id": user_id,
        "status": status,
        "data": data
    }
    if message:
        response["message"] = message
    return response