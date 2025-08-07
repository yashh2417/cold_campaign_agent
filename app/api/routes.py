from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
import time
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







# Add this route to your routes.py for testing
@router.post("/test-webhook")
async def test_webhook(db: Session = Depends(get_db)):
    """Test webhook with sample data"""
    
    # Sample webhook data that Bland AI would send
    sample_data = {
        "call_id": "test-call-123",
        "batch_id": "500bb049-1b6e-4b92-8f2d-a015a0a76e4f",  # Use your actual batch_id
        "status": "completed",
        "created_at": "2025-08-07T01:05:00.000Z",
        "to": "+919818249821",
        "from": "+1234567890",
        "recording_url": "https://example.com/recording.wav",
        "concatenated_transcript": "Hello, this is Maya calling from str. Is this Yash? Yes, this is Yash speaking. Great! I hope you're doing well today...",
        "summary": "Customer was polite and interested in learning more about our services.",
        "call_length": 2.5,  # 2.5 minutes
        "record": True,
        "metadata": {
            "user_id": "1",
            "contact_id": "3",
            "changes": "{}",
            "agent_voice": "maya",
            "agent_name": "maya",
            "agent_role": "talking",
            "language": "en",
            "campaign_name": "str caaling",
            "business_name": "str",
            "business_description": "str is a company....",
            "business_website": "str.co.in",
            "task_description": "greet the user and ask if e is free to talk right now. if he is not free cut the call.",
            "voicemail_message": "string",
            "voicemail_setting": "True",
            "customer_name": "yash",
            "cust_email": "yashh2417@gmail.com",
            "start_time": "2025-08-07T01:00:00.271000+00:00",
            "end_time": "2025-08-07T01:02:00.271000+00:00",
            "task": "You are a professional AI assistant..."
        }
    }
    
    # Convert to JSON string to simulate request
    import json
    from fastapi import Request
    from unittest.mock import Mock
    
    # Create a mock request
    mock_request = Mock(spec=Request)
    mock_request.json = lambda: sample_data
    
    try:
        result = await get_postcall_data(mock_request, db)
        return {"status": "success", "result": result, "message": "Test webhook processed successfully"}
    except Exception as e:
        return {"status": "error", "error": str(e), "message": "Test webhook failed"}
    

    # Add this to your routes.py for testing
@router.get("/test-db")
async def test_database(db: Session = Depends(get_db)):
    """Test database connection and basic operations"""
    try:
        # Test basic query
        from app.models.call_table import User, Campaign, Contact, Call
        
        # Count records
        user_count = db.query(User).count()
        campaign_count = db.query(Campaign).count()
        contact_count = db.query(Contact).count()
        call_count = db.query(Call).count()
        
        return {
            "status": "success",
            "database": "connected",
            "counts": {
                "users": user_count,
                "campaigns": campaign_count,
                "contacts": contact_count,
                "calls": call_count
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "connection_failed",
            "error": str(e)
        }