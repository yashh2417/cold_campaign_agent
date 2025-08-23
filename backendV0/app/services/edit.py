from app.crud.get_data import (
    get_calls_by_batch_id,
    get_contact_by_contact_id,
    get_curr_campaign,
    get_active_calls_by_batch_id,
    get_contacts_from_campaign_id
    )
from app.crud.update import (
    update_contact_db,
    update_campaign_status_by_batch_id 
)
from app.crud.create_db import create_campaign
from datetime import timedelta
from app.core.database import logger
from app.schemas.call import BatchCallItemRequest
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.call import BatchCallRequest
from app.schemas.campaign import CampaignReadPayload
from datetime import datetime,timedelta, timezone
from app.services.create import create_batch_call
from app.services.stop_delete import stop_batch_calls
from sqlalchemy.orm import class_mapper
from app.schemas.contacts import CreateContactTable
def to_dict(obj):
    return {
        column.key: getattr(obj, column.key)
        for column in class_mapper(obj.__class__).columns
    }
from app.schemas.call import (
    BatchCallRequest,
    RequestData,
    GlobalBatch,
    VoiceMail,
    BatchCallItemRequest
)
import json
from sqlalchemy.inspection import inspect
from datetime import datetime
from app.crud.get_data import get_curr_campaign

def to_serializable_dict(obj):
    data = {}
    for c in inspect(obj).mapper.column_attrs:
        value = getattr(obj, c.key)
        if isinstance(value, datetime):
            data[c.key] = value.isoformat()
        else:
            data[c.key] = value
    return data

import json
from app.schemas.call import RequestData


def stringify_dict_values(d):
    """Converts all values in a dictionary to strings."""
    return {k: str(v) for k, v in d.items()}

async def changeCampaign(user_id, batch_id, form_data, db):
    try:
        # Stop existing batch
        try:
            stop_batch_calls(batch_id)
            logger.info(f"Stopped existing batch: {batch_id}")

            update_campaign_status_by_batch_id(db, batch_id, "Inactive")

        except Exception as e:
            logger.warning(f"Could not stop batch {batch_id}: {e}")

        original_campaign = get_curr_campaign(batch_id, db)
        if not original_campaign:
            raise HTTPException(status_code=404, detail="Campaign to edit not found.")

        original_thread_id = str(original_campaign.campaign_thread_id)
        logger.info(f"Editing campaign with thread_id: {original_thread_id}")

        campaign_settings = to_serializable_dict(original_campaign)
        form_data_dict = form_data.model_dump(exclude_none=True)
        campaign_settings.update(form_data_dict)

        contacts_to_recreate = get_contacts_from_campaign_id(original_thread_id, db)
        if not contacts_to_recreate:
            raise HTTPException(status_code=404, detail="No contacts found for the original campaign to recreate.")


        call_objects = []

        for contact_data in contacts_to_recreate:
            # Build request data
            request_data = RequestData(
                agent_name=campaign_settings["agent_name"],
                agent_role=campaign_settings["agent_role"],
                business_name=campaign_settings['business_name'],
                business_description=campaign_settings['business_description'],
                task_description=campaign_settings['task'],
                cust_email=contact_data.email,
                customer_name=contact_data.name
            )


            base_metadata = {
                "is_change": "true",
                "campaign_thread_id": original_thread_id
            }

            combined_metadata = {**campaign_settings, **base_metadata}
            stringified_metadata = stringify_dict_values(combined_metadata)


            call_obj = BatchCallItemRequest(
                phone_number=contact_data.phone_number,
                request_data=request_data,
                metadata=stringified_metadata
            )
            call_objects.append(call_obj)

        # Build voicemail settings
        voicemail_settings = VoiceMail(
            action="leave_message" if campaign_settings.get('voicemail_setting') else "hangup",
            message=campaign_settings.get('voicemail_message', '')
        )


        start_time = campaign_settings.get('campaign_start_date')

        global_settings = GlobalBatch(
            start_time=start_time,
            record=campaign_settings.get('call_recording', True),
            language=campaign_settings.get('language', 'en'),
            voicemail=voicemail_settings,
            webhook=settings.WEBHOOK_URL,
            task="You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}.\n\nContext:\n{{business_description}}\n\nTask Objective:\n{{task_description}}\n\nCustomer Info:\nName: {{customer_name}}\nEmail: {{cust_email}}\n\nGoal:\nConduct a friendly, human-like phone conversation with {{customer_name}}. Present the business offering in a helpful way, and if interested, offer to send information to {{cust_email}}. If the customer is busy or unavailable, politely ask for a better time to call back and confirm availability.\n\nGuidelines:\n- Speak slowly, clearly, and warmly.\n- Begin by introducing yourself as John, the AI assistant calling on behalf of {{business_name}}.\n- Ask if you’re speaking with {{customer_name}}.\n- Be brief but engaging when explaining the service — no long monologues.\n- Pause after each key sentence to let the customer respond.\n- Always check if they’re available to talk before continuing.\n- Ask if they’d like to receive more information via email.\n- If they’re not interested or unavailable, be respectful and offer to follow up later.\n- End the conversation politely and thank them for their time.\n\nExample Flow:\nYou: Hi, is this {{customer_name}}?\n\nCustomer: Yes, speaking.\n\nYou: Great! I'm John, an AI assistant calling on behalf of {{business_name}}. We help people like you by [brief value proposition from {{business_description}}]. Is this a good time to talk?\n\n[Wait for response.]\n\nYou: No worries if you're busy. Would you prefer I call at another time? Or I can email you more information at {{cust_email}} if that’s easier.\n\n[Adjust based on customer response.]\n\nYou: Thank you, {{customer_name}}! I appreciate your time. Have a wonderful day.",
            interruption_threshold=135
        )

        # Create batch request
        new_batch_payload = BatchCallRequest(
            call_objects=call_objects,
            global_keyword=global_settings
        )

        logger.info(f"Sending new, edited batch with {len(call_objects)} calls under the same thread_id.")
        result = await create_batch_call(new_batch_payload)

        # --- THIS IS THE NEW LOGIC ---
        new_batch_id = result.get("data", {}).get("batch_id")
        if new_batch_id:
            # Create a new campaign record with the new batch_id
            new_campaign_data = campaign_settings
            new_campaign_data['batch_id'] = new_batch_id
            new_campaign_data['campaign_thread_id'] = original_thread_id
            new_campaign_data['start_date'] = new_campaign_data.pop('campaign_start_date')
            new_campaign_data['end_date'] = new_campaign_data.pop('campaign_end_date')
            new_campaign_data.pop('campaign_id', None)
            new_campaign_data['campaign_status'] = 'Active'
            create_campaign(new_campaign_data, db)


        return {
            "status": "success",
            "message": "Campaign updated successfully by creating a new batch.",
            "original_thread_id": original_thread_id,
            "new_batch_result": result
        }

    except Exception as e:
        logger.error(f"Error updating campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update campaign: {str(e)}")

def contact_edit(user_id, contact_id, contact_data, db):
    update_data = contact_data.model_dump(exclude_unset=True)
    update_contact_db(contact_id, update_data, db)
    updated_contact = get_contact_by_contact_id(contact_id, db)

    return {'data': updated_contact}