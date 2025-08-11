import json
import uuid
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import logger
from app.core.config import settings
from app.services.utils import llm_generate_data
from app.crud.create_db import create_call, create_campaign
from app.crud.read_db import check_is_active_for_campaign
from app.crud.get_data import (
    get_campaign_by_batch_id, 
    get_call_thread_id, 
    get_campaign_thread_id,
    get_contact_by_phone_number # Import the new helper
)
from app.schemas.call import CallCreate, SendCallRequest
from app.schemas.campaign import CreateCampaignTable
from app.services.scheduler import schedule_next_call
import httpx


def is_active_for_campaign(campaign_thread_id, call_id, db):
    return bool(check_is_active_for_campaign(campaign_thread_id, call_id, db))


def parse_datetime_safe(date_str):
    """Safely parses an ISO datetime string."""
    if not date_str or date_str in ['None', 'null']:
        return None
    try:
        return datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
    except (ValueError, TypeError):
        logger.warning(f"Could not parse invalid datetime: {date_str}")
        return None


async def get_postcall_data(request: Request, db: Session):
    """
    Receive and process webhook callbacks from Bland AI.
    This function now intelligently saves campaign data and call threads.
    """
    logger.info("🔔 WEBHOOK CALLED - Bland AI is sending data")
    try:
        data = await request.json()
        logger.info(f"📥 Raw webhook data received: {json.dumps(data, indent=2, default=str)}")

        # --- 1. VALIDATE INCOMING DATA ---
        metadata = data.get("metadata", {})
        call_id = data.get("call_id")
        user_id = int(metadata.get("user_id"))
        phone_number = data.get("to") # Get the phone number from the call data

        if not call_id:
            raise HTTPException(status_code=400, detail="Missing 'call_id'")
        if not user_id:
            raise HTTPException(status_code=400, detail="Missing 'user_id'")
        if not phone_number:
            raise HTTPException(status_code=400, detail="Missing 'to' phone number")

        # --- 2. ESTABLISH A CONSISTENT CAMPAIGN THREAD ID ---
        campaign_thread_id = get_campaign_thread_id(data, db)

        # --- 3. INTELLIGENTLY SAVE CAMPAIGN (ONCE PER BATCH) ---
        batch_id = data.get('batch_id')
        if batch_id:
            existing_campaign = get_campaign_by_batch_id(batch_id, db)
            if not existing_campaign:
                logger.info(f"First webhook for batch '{batch_id}'. Creating new campaign entry.")
                campaign_data = CreateCampaignTable(
                    user_id=user_id,
                    batch_id=batch_id,
                    campaign_thread_id=str(campaign_thread_id),
                    start_date=parse_datetime_safe(metadata.get('start_time')) or datetime.now(),
                    end_date=parse_datetime_safe(metadata.get('end_time')) or datetime.now() + timedelta(hours=1),
                    task=metadata.get('task'),
                    agent_role=metadata.get('agent_role'),
                    agent_name=metadata.get('agent_name'),
                    agent_voice=metadata.get('agent_voice'),
                    language=metadata.get('language'),
                    voicemail_message=metadata.get('voicemail_message'),
                    call_recording=data.get('record', True),
                    voicemail_setting=metadata.get('voicemail_setting', False),
                    campaign_phone_number=data.get('from'),
                    campaign_name=metadata.get('campaign_name'),
                    business_name=metadata.get('business_name'),
                    business_description=metadata.get('business_description'),
                    business_website=metadata.get('business_website')
                )
                create_campaign(campaign_data, db)
                logger.info(f"✅ Campaign entry for batch '{batch_id}' saved.")
            else:
                logger.info(f"Campaign for batch '{batch_id}' already exists. Skipping creation.")
        else:
            logger.warning("No batch_id in webhook; cannot save campaign data.")

        # --- 4. PROCESS AND SAVE THE INDIVIDUAL CALL RECORD ---
        llm_data = llm_generate_data(data)
        
        # Find the correct contact_id using the phone number
        contact = get_contact_by_phone_number(db, phone_number, user_id)
        correct_contact_id = contact.contact_id if contact else 0

        # Now, get the call_thread_id using the guaranteed correct phone number
        call_thread_id = get_call_thread_id(
            db=db, 
            campaign_thread_id=str(campaign_thread_id), 
            phone_number=phone_number,
            user_id=user_id
        )

        call_duration_str = "N/A"
        if data.get("call_length") is not None:
            total_seconds = int(float(data["call_length"]) * 60)
            minutes, seconds = divmod(total_seconds, 60)
            call_duration_str = f"{minutes}m {seconds}s"

        call_data = CallCreate(
            call_id=call_id,
            user_id=user_id,
            contact_id=correct_contact_id, # Use the corrected contact_id
            batch_id=batch_id,
            campaign_thread_id=str(campaign_thread_id),
            call_thread_id=call_thread_id,
            status=data.get('status', 'completed'),
            to_phone=data.get('to'),
            from_phone=data.get('from'),
            summary=data.get('summary'),
            call_transcript=data.get('concatenated_transcript'),
            recording_url=data.get('recording_url'),
            call_duration=call_duration_str,
            emotion=llm_data.get('customer_reaction'),
            is_call_scheduled=llm_data.get('is_call_scheduled', False),
            scheduled_call_datetime=parse_datetime_safe(llm_data.get('next_call_datetime')),
            timezone=llm_data.get('timezone', 'Unknown'),
            task=metadata.get('task'),
            is_followup=metadata.get('is_followup', False),
            followup_to_call_id=metadata.get('followup_to_call_id'),
            created_at=parse_datetime_safe(data.get('created_at')),
            recording=data.get('record', True)
        )
        
        create_call(db, call_data)
        logger.info(f"✅ Call record '{call_id}' saved to database.")

        return {"status": "success", "message": "Webhook processed successfully."}

    except json.JSONDecodeError:
        logger.error("❌ Failed to decode JSON from request body.")
        raise HTTPException(status_code=400, detail="Could not parse JSON from request.")
    except Exception as e:
        logger.error(f"❌ Unexpected error in webhook processing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error.")
