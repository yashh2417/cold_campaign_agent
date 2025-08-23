import json
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import logger
from app.core.config import settings
from app.services.utils import llm_generate_data, parse_datetime_safe
from app.crud.create_db import create_call
from app.crud.update import update_call_with_id
from app.crud.get_data import (
    get_contact_by_phone_number,
    get_call_by_id,
    get_call_by_batch_and_contact
)
from app.schemas.call import CallCreate, SendCallRequest
from app.services.scheduler import schedule_next_call
import httpx

async def handle_webhook(request: Request, db: Session):
    """
    Handles all webhook events from Bland AI. It differentiates between
    'call_started' and 'post_call' events based on the payload.
    """
    logger.info("🔔 WEBHOOK CALLED - Bland AI is sending data")
    try:
        data = await request.json()
        logger.info(f"📥 Raw webhook data received: {json.dumps(data, indent=2, default=str)}")

        # --- Differentiate event type ---
        if "concatenated_transcript" in data:
            # This is a post-call event
            await handle_postcall_data(data, db)
        else:
            # This is a call-started event
            await handle_call_started(data, db)

        return {"status": "success", "message": "Webhook processed successfully."}

    except json.JSONDecodeError:
        logger.error("❌ Failed to decode JSON from request body.")
        raise HTTPException(status_code=400, detail="Could not parse JSON from request.")
    except Exception as e:
        logger.error(f"❌ Unexpected error in webhook processing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error.")


async def handle_call_started(data: dict, db: Session):
    """
    Handles the 'call_started' event.
    """
    call_id = data.get("call_id")
    batch_id = data.get("batch_id")
    contact_id = data.get("metadata", {}).get("contact_id")

    if not all([call_id, batch_id, contact_id]):
        raise HTTPException(status_code=400, detail="Missing required data for call initiation.")

    # Find the placeholder record
    placeholder_call = get_call_by_batch_and_contact(db, batch_id, int(contact_id))

    if placeholder_call:
        # Update the placeholder with the new call_id
        update_call_with_id(db, placeholder_call.id, call_id, placeholder_call.campaign_thread_id)
        logger.info(f"✅ Call record for contact {contact_id} updated with call_id: {call_id}")
    else:
        logger.error(f"❌ No placeholder found for contact {contact_id} in batch {batch_id}")
        raise HTTPException(status_code=404, detail="Placeholder call record not found.")


async def handle_postcall_data(data: dict, db: Session):
    """
    Handles the 'post_call' event.
    """
    # --- 1. Validate incoming data ---
    metadata = data.get("metadata", {})
    call_id = data.get("call_id")
    batch_id = data.get("batch_id")
    contact_id = metadata.get("contact_id")
    user_id = int(metadata.get("user_id"))
    phone_number = data.get("to")

    # Accept test calls with batch_id=None or contact_id='0'
    if not call_id or not user_id or not phone_number:
        raise HTTPException(status_code=400, detail="Missing required data in post-call webhook.")

    is_test_call = batch_id is None or contact_id in (None, "0", 0)

    if is_test_call:
        # For test calls, just log and return success
        logger.info(f"Test call webhook received for call_id: {call_id}, no DB update required.")
        return {"status": "success", "message": "Test call webhook processed, no DB update."}

    # --- 2. Find the existing call record ---
    existing_call = get_call_by_id(db, call_id)

    # ** Fallback logic **
    if not existing_call:
        logger.warning(f"⚠️ No call record found for call_id: {call_id}. Attempting to find placeholder via batch and contact.")
        existing_call = get_call_by_batch_and_contact(db, batch_id, int(contact_id))
        if existing_call:
            # If we found the placeholder, update it with the call_id now
            existing_call.call_id = call_id
            db.commit()
            logger.info(f"✅ Found placeholder and updated with call_id: {call_id}")
        else:
            logger.error(f"❌ Critical: Could not find any record for call_id {call_id} or for contact {contact_id} in batch {batch_id}.")
            raise HTTPException(status_code=404, detail=f"No existing call record found for call_id: {call_id}")


    # --- 3. Process and update the call record ---
    llm_data = llm_generate_data(data)
    contact = get_contact_by_phone_number(db, phone_number, user_id)

    call_duration_str = "N/A"
    if data.get("call_length") is not None:
        total_seconds = int(float(data["call_length"]) * 60)
        minutes, seconds = divmod(total_seconds, 60)
        call_duration_str = f"{minutes}m {seconds}s"

    # Update the existing record with the full details from the webhook
    existing_call.status = data.get('status', 'completed')
    existing_call.summary = data.get('summary')
    existing_call.call_transcript = data.get('concatenated_transcript')
    existing_call.recording_url = data.get('recording_url')
    existing_call.call_duration = call_duration_str
    existing_call.emotion = llm_data.get('customer_reaction')
    existing_call.is_call_scheduled = llm_data.get('is_call_scheduled', False)
    existing_call.scheduled_call_datetime = parse_datetime_safe(llm_data.get('next_call_datetime'))
    existing_call.timezone = llm_data.get('timezone', 'Unknown')
    existing_call.task = metadata.get('task')
    existing_call.is_followup = metadata.get('is_followup', False)
    existing_call.followup_to_call_id = metadata.get('followup_to_call_id')
    existing_call.created_at = parse_datetime_safe(data.get('created_at'))
    existing_call.recording = data.get('record', True)

    # db.commit()
    # logger.info(f"✅ Call record '{call_id}' updated in the database.")

    # --- 4. Schedule a follow-up if needed ---
    follow_up_time = None

    if llm_data.get('customer_reaction') == 'neutral' or llm_data.get('is_call_scheduled'):
        if llm_data.get('next_call_datetime'):
            logger.info(f"🗓️ Scheduling a follow-up for call_id: {call_id} at user-specified time.")
            follow_up_time = llm_data.get('next_call_datetime')
        else:
            logger.info(f"🗓️ Scheduling a follow-up for call_id: {call_id} with a 1-hour buffer.")
            follow_up_time = datetime.now(timezone.utc) + timedelta(hours=1)

        if follow_up_time and contact:
            follow_up_request = SendCallRequest(
                to_phone=data.get('to'),
                request_data={
                    "business_name": metadata.get('business_name'),
                    "business_description": metadata.get('business_description'),
                    "task_description": metadata.get('task'),
                    "customer_name": contact.name,
                    "cust_email": contact.email,
                    "agent_name": metadata.get('agent_name'),
                    "agent_role": metadata.get('agent_role'),
                },
                metadata={
                    **metadata,
                    "is_followup": "True",
                    "followup_to_call_id": call_id
                }
            )
            await schedule_next_call(
                data=follow_up_request,
                transcript=data.get('concatenated_transcript'),
                date=follow_up_time,
                followup_to_call_id=call_id
            )
    else:
        existing_call.is_call_scheduled = llm_data.get('is_call_scheduled', False)
        existing_call.is_followup = metadata.get('is_followup', False)

    db.commit()
    logger.info(f"✅ Call record '{call_id}' updated in the database.")