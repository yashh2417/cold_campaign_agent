from app.crud.get_data import (
    get_calls_by_batch_id,
    get_contact_by_contact_id,
    get_curr_campaign
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
    GlobalBatch,  # This was missing
    VoiceMail,    # This was missing
    BatchCallItemRequest  # This was also missing
)
import json
from sqlalchemy.inspection import inspect
from datetime import datetime

def to_serializable_dict(obj):
    data = {}
    for c in inspect(obj).mapper.column_attrs:
        value = getattr(obj, c.key)
        if isinstance(value, datetime):
            data[c.key] = value.isoformat()  # convert datetime to string
        else:
            data[c.key] = value
    return data

import json
from app.schemas.call import RequestData


# async def changeCampaign(user_id,batch_id,form_data,db):
#     try:
#         stop_batch_calls(batch_id)
#     except:
#         print("Batch Not scheduled or active")
#     campaign_data = get_curr_campaign(batch_id,db)
#     campaign_data.campaign_thread_id = str(campaign_data.campaign_thread_id)
#     campaign_data = json.loads(json.dumps(to_serializable_dict(campaign_data)))
#     campaign_thread_id = campaign_data['campaign_thread_id']

#     form_data = form_data.model_dump(exclude_none=True)

#     calls = get_calls_by_batch_id(batch_id,db)

#     batch_payload = {"call_objects":[],
#                      "global_keyword":{}}
    

#     change_dict = {}
    
#     for k,v in form_data.items():
#         change_dict.update({k:v})
#         campaign_data.update({k : v})
#     print('Campaign Data : ',campaign_data,sep = "\n\n")

#     for call in calls:
        
#         call_dict = CampaignReadPayload.model_validate(call,from_attributes=True).model_dump()
#         contact_data = get_contact_by_contact_id(call_dict['contact_id'],db=db)
#         contact_name,contact_mail = contact_data.name,contact_data.email
#         req_data = RequestData(
#             agent_name = campaign_data["agent_name"],
#             agent_role=campaign_data["agent_role"],
#             business_description=campaign_data['business_description'],
#             business_name=campaign_data['business_name'],
#             task_description=campaign_data['task'],
#             cust_email=contact_mail,
#             customer_name=contact_name
#         )
#         call_dict["request_data"] = req_data
#         call_dict["metadata"] = {
#             "user_id": str(user_id),
#             "contact_id": str(contact_data.contact_id),
#             "campaign_thread_id": str(campaign_thread_id),
#             "changes": json.dumps(campaign_data),  # Convert dictionary to a JSON string
#             "agent_name": str(campaign_data["agent_name"]),
#             "agent_role": str(campaign_data["agent_role"]),
#             "business_name": str(campaign_data['business_name']),
#             "business_description": str(campaign_data['business_description']),
#             "task_description": str(campaign_data['task']),
#             "customer_name": str(contact_name),
#             "cust_email": str(contact_mail),
#             "start_time": str(datetime.now(timezone.utc) + timedelta(minutes=1)), # Convert datetime to string
#             "end_time": str(datetime.now(timezone.utc) + timedelta(minutes=1)),   # Convert datetime to string
#             "task": "You are a professional, warm, and articulate AI..." # Task string remains the same
#         }
#         batch_payload['call_objects'].append(call_dict)
    
#     batch_payload['global_keyword'] = {
#                                 "record":True,
#                                 "start_time": datetime.now(timezone.utc) +timedelta(minutes=1),
#                                 "webhook": settings.WEBHOOK_URL,
#                                 "task":"You are a professional, warm, and articulate AI sales assistant named John, calling on behalf of {{business_name}}.\n\nContext:\n{{business_description}}\n\nTask Objective:\n{{task_description}}\n\nCustomer Info:\nName: {{customer_name}}\nEmail: {{cust_email}}\n\nGoal:\nConduct a friendly, human-like phone conversation with {{customer_name}}. Present the business offering in a helpful way, and if interested, offer to send information to {{cust_email}}. If the customer is busy or unavailable, politely ask for a better time to call back and confirm availability.\n\nGuidelines:\n- Speak slowly, clearly, and warmly.\n- Begin by introducing yourself as John, the AI assistant calling on behalf of {{business_name}}.\n- Ask if you’re speaking with {{customer_name}}.\n- Be brief but engaging when explaining the service — no long monologues.\n- Pause after each key sentence to let the customer respond.\n- Always check if they’re available to talk before continuing.\n- Ask if they’d like to receive more information via email.\n- If they’re not interested or unavailable, be respectful and offer to follow up later.\n- End the conversation politely and thank them for their time.\n\nExample Flow:\nYou: Hi, is this {{customer_name}}?\n\nCustomer: Yes, speaking.\n\nYou: Great! I'm John, an AI assistant calling on behalf of {{business_name}}. We help people like you by [brief value proposition from {{business_description}}]. Is this a good time to talk?\n\n[Wait for response.]\n\nYou: No worries if you're busy. Would you prefer I call at another time? Or I can email you more information at {{cust_email}} if that’s easier.\n\n[Adjust based on customer response.]\n\nYou: Thank you, {{customer_name}}! I appreciate your time. Have a wonderful day."
#                               }
    
#     batch_payload_model = BatchCallRequest.model_validate(batch_payload)
#     batch_payload = batch_payload_model.model_dump()

#     await create_batch_call(batch_payload_model)
#     return {"call_IDs":[{"call_id":call.call_id} for call in calls],
#             "Data":batch_payload}

async def changeCampaign(user_id, batch_id, form_data, db):
    try:
        # Stop existing batch
        try:
            stop_batch_calls(batch_id)
            logger.info(f"Stopped existing batch: {batch_id}")
        except Exception as e:
            logger.warning(f"Could not stop batch {batch_id}: {e}")

        # Get current campaign data
        campaign_data = get_curr_campaign(batch_id, db)
        campaign_data.campaign_thread_id = str(campaign_data.campaign_thread_id)
        campaign_data = json.loads(json.dumps(to_serializable_dict(campaign_data)))
        campaign_thread_id = campaign_data['campaign_thread_id']

        # Update campaign data with form changes
        form_data_dict = form_data.model_dump(exclude_none=True)
        
        # FIX: Map form fields to campaign fields properly
        field_mapping = {
            'campaign_name': 'campaign_name',
            'business_name': 'business_name', 
            'business_description': 'business_description',
            'business_website': 'business_website',
            'agent_name': 'agent_name',
            'agent_voice': 'agent_voice',
            'agent_role': 'agent_role',
            'language': 'language',
            'task': 'task',
            'call_recording': 'call_recording',
            'voicemail_message': 'voicemail_message',
            'voicemail_setting': 'voicemail_setting'
        }

        for form_key, campaign_key in field_mapping.items():
            if form_key in form_data_dict:
                campaign_data[campaign_key] = form_data_dict[form_key]

        logger.info(f"Updated campaign data: {campaign_data}")

        # Get all calls for this batch
        calls = get_calls_by_batch_id(batch_id, db)
        
        if not calls:
            raise HTTPException(status_code=404, detail="No calls found for this batch")

        call_objects = []
        
        for call in calls:
            # Get contact data
            contact_data = get_contact_by_contact_id(call.contact_id, db=db)
            contact_name, contact_mail = contact_data.name, contact_data.email
            
            # Build request data
            req_data = RequestData(
                agent_name=campaign_data["agent_name"],
                agent_role=campaign_data["agent_role"],
                business_description=campaign_data['business_description'],
                business_name=campaign_data['business_name'],
                task_description=campaign_data['task'],
                cust_email=contact_mail,
                customer_name=contact_name
            )
            
            # Build call object
            call_obj = BatchCallItemRequest(
                to_phone=call.to_phone,
                request_data=req_data,
                metadata={
                    "user_id": str(user_id),
                    "contact_id": str(contact_data.contact_id),
                    "campaign_thread_id": str(campaign_thread_id),
                    "is_change": "true",  # FIX: Mark as update
                    "changes": json.dumps(campaign_data),
                    "agent_name": str(campaign_data["agent_name"]),
                    "agent_role": str(campaign_data["agent_role"]),
                    "agent_voice": str(campaign_data.get("agent_voice", "maya")),
                    "business_name": str(campaign_data['business_name']),
                    "business_description": str(campaign_data['business_description']),
                    "task_description": str(campaign_data['task']),
                    "customer_name": str(contact_name),
                    "cust_email": str(contact_mail),
                    "start_time": str(datetime.now(timezone.utc) + timedelta(minutes=2)),
                    "end_time": str(datetime.now(timezone.utc) + timedelta(minutes=2)),
                    "campaign_name": str(campaign_data.get('campaign_name', 'Updated Campaign')),
                    "business_website": str(campaign_data.get('business_website', '')),
                    "language": str(campaign_data.get('language', 'en')),
                    "voicemail_message": str(campaign_data.get('voicemail_message', '')),
                    "voicemail_setting": str(campaign_data.get('voicemail_setting', False)),
                    "task": "You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}..."
                }
            )
            call_objects.append(call_obj)

        # Build voicemail settings
        voicemail_data = VoiceMail(
            action="leave_message" if campaign_data.get('voicemail_setting') else "hangup",
            message=campaign_data.get('voicemail_message', '') if campaign_data.get('voicemail_setting') else ""
        )

        # Build global settings
        global_keys = GlobalBatch(
            start_time=datetime.now(timezone.utc) + timedelta(minutes=2),
            record=campaign_data.get('call_recording', True),
            language=campaign_data.get('language', 'en'),
            voicemail=voicemail_data,
            webhook=settings.WEBHOOK_URL,
            task="You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}..."
        )

        # Create batch request
        batch_payload = BatchCallRequest(
            call_objects=call_objects,
            global_keyword=global_keys
        )

        logger.info(f"Sending updated batch with {len(call_objects)} calls")
        
        # Send the updated batch
        result = await create_batch_call(batch_payload)
        
        return {
            "status": "success",
            "message": "Campaign updated successfully",
            "batch_result": result,
            "call_count": len(call_objects)
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