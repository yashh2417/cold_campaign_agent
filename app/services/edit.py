from app.crud.get_data import (
    get_calls_by_batch_id,
    get_contact_by_contact_id,
    get_curr_campaign,
    get_active_calls_by_batch_id
    )
from app.crud.update import (
    update_contact_db
)
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

        # calls_to_recreate = get_calls_by_batch_id(batch_id, db)
        calls_to_recreate = get_active_calls_by_batch_id(batch_id, db)
        if not calls_to_recreate:
            raise HTTPException(status_code=404, detail="No calls found for the original batch to recreate.")


        call_objects = []
        
        for call in calls_to_recreate:
            # Get contact data
            contact_data = get_contact_by_contact_id(call.contact_id, db=db)
            # contact_name, contact_mail = contact_data.name, contact_data.email
            
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
            start_time=start_time, # Use the correct start time from the form
            record=campaign_settings.get('call_recording', True),
            language=campaign_settings.get('language', 'en'),
            voicemail=voicemail_settings,
            webhook=settings.WEBHOOK_URL,
            task=campaign_settings.get('task')
        )

        # Create batch request
        new_batch_payload = BatchCallRequest(
            call_objects=call_objects,
            global_keyword=global_settings
        )

        logger.info(f"Sending new, edited batch with {len(call_objects)} calls under the same thread_id.")
        result = await create_batch_call(new_batch_payload)
        
        return {
            "status": "success",
            "message": "Campaign updated successfully by creating a new batch.",
            "original_thread_id": original_thread_id,
            "new_batch_result": result
        }

    except Exception as e:
        logger.error(f"Error updating campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update campaign: {str(e)}")
    
def contact_edit(user_id,contact_id,contact_data,db):
    curr_contact_data = CreateContactTable.model_validate(get_contact_by_contact_id(contact_id,db)).model_dump()
    print(curr_contact_data)
    for k,v in contact_data.items():
        print(k,v)
        curr_contact_data.update({k:v})
    print(curr_contact_data)
    update_contact_db(contact_id,contact_data,db)
    return {'data':curr_contact_data}