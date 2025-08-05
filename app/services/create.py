from app.crud.create_db import create_new_contact_db
from app.core.database import logger
from fastapi import Request, HTTPException
import requests
from app.core.config import settings
from app.services.utils import llm_generate_data,format_datetime
import requests
from app.services.utils import serialize_datetimes
from app.crud.get_data import get_contact_from_contactID
from app.schemas.contacts import CreateContactTable
from app.schemas.call import (
    BatchCallRequest,
    RequestData,
    GlobalBatch,
    VoiceMail,
    BatchCallItemRequest
    )
from datetime import datetime, timedelta,timezone

def create_new_contact(user_id,contact_data,db):
    return create_new_contact_db(user_id,contact_data,db)


async def create_single_call(request):
    """Send a single AI phone call"""
   
    try:
        url = "https://api.bland.ai/v1/calls"
        bland_api_key = settings.BLAND_API_KEY

        if not bland_api_key:
            raise HTTPException(status_code=500, detail="BLAND_API_KEY not configured")

        headers = {
            "Authorization": f"Bearer {bland_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "phone_number": request.to_phone,
            "ivr_mode":request.ivr_mode,
            "voice_id":request.voice_id,
            'reduce_latency':request.reduce_latency,
            "request_data":request.request_data,
            "record":request.record,
            "webhook":request.webhook,
            "metadata":request.request_data
        }

        # Optional fields
        if request.pathway_id != None:
            payload['pathway_id'] = request.pathway_id
        if request.start_time:
            payload["start_time"] = request.start_time
        if request.request_data :
            payload["request_data"] = request.request_data
        if request.metadata:
            payload["metadata"] = request.metadata
        if request.task:
            payload["task"] = request.task


        logger.info(f"📞 Sending call to {request.to_phone}")
        logger.info(f"Giving call payload {payload}")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        logger.info(f"✅ Call sent successfully: {result}")

        return result

    except requests.exceptions.HTTPError as http_err:
        logger.error(f"❌ HTTP error: {http_err}")
        error_detail = f"HTTP error occurred: {http_err}"
        if hasattr(http_err, 'response') and http_err.response:
            error_detail += f" - {http_err.response.text}"
        raise HTTPException(status_code=400, detail=error_detail)

    except requests.exceptions.Timeout:
        logger.error("❌ Request timeout")
        raise HTTPException(status_code=408, detail="Request timeout")

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send call")

    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def create_batch_call(request):
    """Send batch AI phone calls"""
    try:
        url = "https://api.bland.ai/v2/batches/create"
        bland_api_key = settings.BLAND_API_KEY
        
        if not bland_api_key:
            raise HTTPException(status_code=500, detail="BLAND_API_KEY not configured")
        
        headers = {
            "Authorization": f"Bearer {bland_api_key}",
            "Content-Type": "application/json"
        }

        global_payload = {
            "start_time":str(format_datetime(str(request.global_keyword.start_time))),
            "task": request.global_keyword.task,
            "record":request.global_keyword.record,
            "webhook":request.global_keyword.webhook
        }
        

        call_objs = request.call_objects
        payload = {
        "global": global_payload,
        "call_objects": [
        {
            "phone_number": call.to_phone,
            "request_data": call.request_data.model_dump(),  
            "ivr_mode": call.ivr_mode,
            "voice_id": call.voice_id,
            "reduce_latency": call.reduce_latency,
            "metadata": call.metadata  
        }
        for call in call_objs]
        }


        logger.info(f"📞 Sending batch of {len(call_objs)} calls")
        payload = serialize_datetimes(payload)
        print(payload)
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"✅ Batch sent successfully: {result}")
        
        return result

    except requests.exceptions.HTTPError as http_err:
        logger.error(f"❌ HTTP error: {http_err}")
        error_detail = f"HTTP error occurred: {http_err}"
        if hasattr(http_err, 'response') and http_err.response:
            error_detail += f" - {http_err.response.text}"
        raise HTTPException(status_code=400, detail=error_detail)
    
    except requests.exceptions.Timeout:
        logger.error("❌ Request timeout")
        raise HTTPException(status_code=408, detail="Request timeout")
    
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send batch")
    
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def create_campaign_batch(user_id,data,db):
    form_data = data.form_data
    contacts = data.contacts
    print(form_data)
    print(contacts)
    call_objs = []
    for contact_id in contacts:
        contact = get_contact_from_contactID(contact_id,db)
        contact = (CreateContactTable.model_validate(contact)).model_dump()
        print(contact)
        request_data_form = RequestData(
            agent_name=form_data.agent_name,
            agent_role=form_data.agent_role,
            business_description=form_data.business_description,
            business_name=form_data.business_name,
            task_description=form_data.task,
            cust_email=contact['email'],
            customer_name=contact['contact_name']
        )
        batch_item = BatchCallItemRequest(
            to_phone=contact['phone_number'],
            request_data=request_data_form,
            metadata={
                    "user_id":str(user_id),
                    "contact_id":str(contact['contact_id']),

                    "changes":"{}",

                    "agent_voice":str(form_data.agent_voice),
                    "agent_name":str(request_data_form.agent_name),
                    "agent_role":str(request_data_form.agent_role),
                    "language":str(form_data.language),
                    
                    "campaign_name": str(form_data.campaign_name),
                    "business_name": str(request_data_form.business_name),
                    "business_description": str(request_data_form.business_description),
                    "business_website":str(form_data.business_website),
                    "task_description": str(request_data_form.task_description),
                    
                    "voicemail_message": str(form_data.voicemail_message),
                    "voicemail_setting": str(form_data.voicemail_setting),

                    "customer_name":str(request_data_form.customer_name),
                    "cust_email": str(request_data_form.cust_email),
                    
                    "start_time": str(form_data.campaign_start_date),
                    "end_time": str(form_data.campaign_end_date),
                    
                    "task":"You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}.\n\nContext:\n{{business_description}}\n\nTask Objective:\n{{task_description}}\n\nCustomer Info:\nName: {{customer_name}}\nEmail: {{cust_email}}\n\nGoal:\nConduct a friendly, human-like phone conversation with {{customer_name}}. Present the business offering in a helpful way, and if interested, offer to send information to {{cust_email}}. If the customer is busy or unavailable, politely ask for a better time to call back and confirm availability.\n\nGuidelines:\n- Speak slowly, clearly, and warmly.\n- Begin by introducing yourself as John, the AI assistant calling on behalf of {{business_name}}.\n- Ask if you’re speaking with {{customer_name}}.\n- Be brief but engaging when explaining the service — no long monologues.\n- Pause after each key sentence to let the customer respond.\n- Always check if they’re available to talk before continuing.\n- Ask if they’d like to receive more information via email.\n- If they’re not interested or unavailable, be respectful and offer to follow up later.\n- End the conversation politely and thank them for their time.\n\nExample Flow:\nYou: Hi, is this {{customer_name}}?\n\nCustomer: Yes, speaking.\n\nYou: Great! I'm John, an AI assistant calling on behalf of {{business_name}}. We help people like you by [brief value proposition from {{business_description}}]. Is this a good time to talk?\n\n[Wait for response.]\n\nYou: No worries if you're busy. Would you prefer I call at another time? Or I can email you more information at {{cust_email}} if that’s easier.\n\n[Adjust based on customer response.]\n\nYou: Thank you, {{customer_name}}! I appreciate your time. Have a wonderful day."
                    }

        )
        call_objs.append(batch_item)

    voicemail_data = VoiceMail(
        action="leave_message" if form_data.voicemail_setting else "hangup",
        message=form_data.voicemail_message if form_data.voicemail_setting else ""
    )
    global_keys = GlobalBatch(
        start_time=form_data.campaign_start_date,
        record=form_data.call_recording,
        language=form_data.language,
        voicemail=voicemail_data ,
        task="You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}.\n\nContext:\n{{business_description}}\n\nTask Objective:\n{{task_description}}\n\nCustomer Info:\nName: {{customer_name}}\nEmail: {{cust_email}}\n\nGoal:\nConduct a friendly, human-like phone conversation with {{customer_name}}. Present the business offering in a helpful way, and if interested, offer to send information to {{cust_email}}. If the customer is busy or unavailable, politely ask for a better time to call back and confirm availability.\n\nGuidelines:\n- Speak slowly, clearly, and warmly.\n- Begin by introducing yourself as John, the AI assistant calling on behalf of {{business_name}}.\n- Ask if you’re speaking with {{customer_name}}.\n- Be brief but engaging when explaining the service — no long monologues.\n- Pause after each key sentence to let the customer respond.\n- Always check if they’re available to talk before continuing.\n- Ask if they’d like to receive more information via email.\n- If they’re not interested or unavailable, be respectful and offer to follow up later.\n- End the conversation politely and thank them for their time.\n\nExample Flow:\nYou: Hi, is this {{customer_name}}?\n\nCustomer: Yes, speaking.\n\nYou: Great! I'm John, an AI assistant calling on behalf of {{business_name}}. We help people like you by [brief value proposition from {{business_description}}]. Is this a good time to talk?\n\n[Wait for response.]\n\nYou: No worries if you're busy. Would you prefer I call at another time? Or I can email you more information at {{cust_email}} if that’s easier.\n\n[Adjust based on customer response.]\n\nYou: Thank you, {{customer_name}}! I appreciate your time. Have a wonderful day."
    )
    batch_payload = BatchCallRequest(call_objects=call_objs,
                     global_keyword=global_keys)
    print(batch_payload.model_dump())
    await create_batch_call(batch_payload)
    return {"data":batch_payload,"user_id":user_id}



async def make_test_call(user_id,data,db):
    form_data = data.form_data
    contacts = data.contacts
    
    print(form_data)
    print(contacts)
    call_objs = []
    for contact_id in contacts:
        contact = get_contact_from_contactID(contact_id,db)
        contact = (CreateContactTable.model_validate(contact)).model_dump()
        print(contact)
        request_data_form = RequestData(
            agent_name=form_data.agent_name,
            agent_role=form_data.agent_role,
            business_description=form_data.business_description,
            business_name=form_data.business_name,
            task_description=form_data.task,
            cust_email=contact['email'],
            customer_name=contact['contact_name']
        )
        batch_item = BatchCallItemRequest(
            to_phone=contact['phone_number'],
            request_data=request_data_form,
            metadata={
                    "user_id":str(user_id),
                    "changes":"{}",
                    "agent_name":str(request_data_form.agent_name),
                    "agent_role":str(request_data_form.agent_role),
                    "contact_id":str(contact['contact_id']),
                    "business_name": str(request_data_form.business_name),
                    "business_description": str(request_data_form.business_description),
                    "task_description": str(request_data_form.task_description),
                    "customer_name":str(request_data_form.customer_name),
                    "cust_email": str(request_data_form.cust_email),
                    "start_time": str(form_data.campaign_start_date),
                    "end_time": str(form_data.campaign_end_date),
                    "task":"You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}.\n\nContext:\n{{business_description}}\n\nTask Objective:\n{{task_description}}\n\nCustomer Info:\nName: {{customer_name}}\nEmail: {{cust_email}}\n\nGoal:\nConduct a friendly, human-like phone conversation with {{customer_name}}. Present the business offering in a helpful way, and if interested, offer to send information to {{cust_email}}. If the customer is busy or unavailable, politely ask for a better time to call back and confirm availability.\n\nGuidelines:\n- Speak slowly, clearly, and warmly.\n- Begin by introducing yourself as John, the AI assistant calling on behalf of {{business_name}}.\n- Ask if you’re speaking with {{customer_name}}.\n- Be brief but engaging when explaining the service — no long monologues.\n- Pause after each key sentence to let the customer respond.\n- Always check if they’re available to talk before continuing.\n- Ask if they’d like to receive more information via email.\n- If they’re not interested or unavailable, be respectful and offer to follow up later.\n- End the conversation politely and thank them for their time.\n\nExample Flow:\nYou: Hi, is this {{customer_name}}?\n\nCustomer: Yes, speaking.\n\nYou: Great! I'm John, an AI assistant calling on behalf of {{business_name}}. We help people like you by [brief value proposition from {{business_description}}]. Is this a good time to talk?\n\n[Wait for response.]\n\nYou: No worries if you're busy. Would you prefer I call at another time? Or I can email you more information at {{cust_email}} if that’s easier.\n\n[Adjust based on customer response.]\n\nYou: Thank you, {{customer_name}}! I appreciate your time. Have a wonderful day."
                    }

        )
        call_objs.append(batch_item)

    voicemail_data = VoiceMail(
        action="leave_message" if form_data.voicemail_setting else "hangup",
        message=form_data.voicemail_message if form_data.voicemail_setting else ""
    )
    global_keys = GlobalBatch(
        start_time=form_data.campaign_start_date,
        record=form_data.call_recording,
        language=form_data.language,
        voicemail=voicemail_data ,
        task="You are a professional, warm, and articulate AI {{agent_role}} named {{agent_name}}, calling on behalf of {{business_name}}.\n\nContext:\n{{business_description}}\n\nTask Objective:\n{{task_description}}\n\nCustomer Info:\nName: {{customer_name}}\nEmail: {{cust_email}}\n\nGoal:\nConduct a friendly, human-like phone conversation with {{customer_name}}. Present the business offering in a helpful way, and if interested, offer to send information to {{cust_email}}. If the customer is busy or unavailable, politely ask for a better time to call back and confirm availability.\n\nGuidelines:\n- Speak slowly, clearly, and warmly.\n- Begin by introducing yourself as John, the AI assistant calling on behalf of {{business_name}}.\n- Ask if you’re speaking with {{customer_name}}.\n- Be brief but engaging when explaining the service — no long monologues.\n- Pause after each key sentence to let the customer respond.\n- Always check if they’re available to talk before continuing.\n- Ask if they’d like to receive more information via email.\n- If they’re not interested or unavailable, be respectful and offer to follow up later.\n- End the conversation politely and thank them for their time.\n\nExample Flow:\nYou: Hi, is this {{customer_name}}?\n\nCustomer: Yes, speaking.\n\nYou: Great! I'm John, an AI assistant calling on behalf of {{business_name}}. We help people like you by [brief value proposition from {{business_description}}]. Is this a good time to talk?\n\n[Wait for response.]\n\nYou: No worries if you're busy. Would you prefer I call at another time? Or I can email you more information at {{cust_email}} if that’s easier.\n\n[Adjust based on customer response.]\n\nYou: Thank you, {{customer_name}}! I appreciate your time. Have a wonderful day."
    )
    batch_payload = BatchCallRequest(call_objects=call_objs,
                     global_keyword=global_keys)
    print(batch_payload.model_dump())
    await create_batch_call(batch_payload)
    return {"data":batch_payload,"user_id":user_id}