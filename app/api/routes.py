from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from app.schemas.utils import(
    TTSRequest
)
from app.schemas.contacts import (
    CreateContact
)

from app.services.create import (
    create_new_contact
)
from app.core.dependencies import (
    get_current_user,
    get_db
)
from app.services.webhook import (
    get_postcall_data
)
from app.core.templates import templates 
from app.services.tts import ai_TTS


router = APIRouter(tags=["main"])


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the dashboard homepage"""
    return templates.TemplateResponse("index.html", {"request": request})

@router.post("/bland/postcall")
async def receive_postcall(request: Request,db: Session = Depends(get_db)):
    return await get_postcall_data(request,db)


@router.post("/speak-AI")
async def ai_speak(req:TTSRequest):
    return await ai_TTS(req)