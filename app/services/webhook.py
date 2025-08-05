from app.core.database import logger
from app.services.utils import llm_generate_data,format_datetime
from fastapi import Request,HTTPException
from app.core.config import settings
from sqlalchemy.orm import Session
import requests
from app.crud.get_data import (
    get_call_thread_id,
    get_scheduled_call,
    get_campaign_thread_id
)

from app.crud.create_db import (
    create_call,
    create_campaign
)
from app.schemas.campaign import CreateCampaignTable
from app.services.scheduler import schedule_next_call
from app.schemas.call import (
    CallCreate, 
    SendCallRequest
)
from app.crud.read_db import check_is_active_for_campaign
from app.schemas.campaign import CreateCampaignForm
# from app.services.tasks import schedule_next_call
from datetime import datetime

def is_active_for_campaign(campaign_thread_id,call_id,db):
    return bool(check_is_active_for_campaign(campaign_thread_id,call_id,db))


# def analysis_endpoint(call_id,llm_data):
#     # Call Bland AI analysis endpoint
#     analysis_data = None
#     bland_api_key = settings.BLAND_API_KEY
    
#     if bland_api_key and call_id:
#         try:
#             headers = {"Authorization": f"Bearer {bland_api_key}"}
#             analysis_url = f"https://api.bland.ai/v1/calls/{call_id}/analyze"
#             analysis_payload = {
#                 "goal": "Understand the customer's interest in the product and pay attention to whether they want to schedule another call",
#                 "questions": [
#                     ["Did customer answer","boolean"],
#                     ["what was the customer's reaction to the product", " 'positive' or 'negative' or 'neutral' "],
#                     ["Is call scheduled, Return True if a follow-up call is scheduled, otherwise False.", "boolean"],
#                     ["Next Call Schedule Data, give timestamp if specified,Extract the date and time of the next scheduled call, if mentioned. Format it as an ISO 8601 string (e.g., '2025-07-19T15:00:00').","string"],
#                     ["Next Call Schedule Data, give Timezone if specified","string"]
#                 ]
#             }

#             analysis_response = requests.post(
#                 analysis_url, 
#                 json=analysis_payload, 
#                 headers=headers,
#                 timeout=30
#             )
            
#             if analysis_response.status_code == 200:
#                 analysis_data =  analysis_response.json()
#                 logger.info(f"📊 Analysis successful: {analysis_data}")
#                 logger.info(f"📊 LLM Data: {llm_data}")
#                 return analysis_data
#             else:
#                 logger.error(f"❌ Analysis API error: {analysis_response.status_code} - {analysis_response.text}")
                
#         except requests.exceptions.RequestException as e:
#             logger.error(f"❌ Analysis request failed: {e}")
#         except Exception as e:
#             logger.error(f"❌ Analysis processing error: {e}")





async def get_postcall_data(request: Request, db: Session):
    """Receive and process webhook callbacks from Bland AI"""
    try:
        data =  await request.json()
        llm_data = llm_generate_data(data)
        logger.info(f"📥 Incoming Webhook Payload: {data}")


        call_id = str(data.get("call_id"))
        transcript = str(data.get("concatenated_transcript"))
        summary = str(data.get("summary"))
        call_to = str(data.get("to"))
        call_from = str(data.get("from"))

        logger.info(f"🆔 Call ID: {call_id}")
        logger.info(f"📄 Summary: {summary}")
        

        if not call_id:
            logger.error("❌ Missing call_id in webhook payload")
            raise HTTPException(status_code=400, detail="Missing call_id")

        if not isinstance(transcript, str):
            logger.error("❌ Invalid transcript format")
            raise HTTPException(status_code=400, detail="Invalid transcript format")
        
        logger.info(f"📝 Transcript Text: {transcript}")

        analysis_data=llm_data


        try:
            print('Batch ID:', data.get('batch_id'))

            metadata_payload = data.get('metadata', {})
            thread_id = get_call_thread_id(db=db, data=data)

            print("Thread ID:", thread_id, type(thread_id))

            # variables = data.get('variables',{})
            # var_metadata = variables.get('metadata',{})
            metadata = data.get('metadata',{})

            # Handle campaign changes
            changes = metadata.get('changes')
            if changes!="{}" and isinstance(changes, str):
                changes.pop('campaign_id', None)
                changes['batch_id'] = data.get('batch_id')
                try:
                    campaign_data = CreateCampaignTable(**changes)
                    create_campaign(campaign_data, db)
                except Exception as e:
                    logger.warning("Failed to create campaign: %s", e)
            

            # Process call creation
            analysis_answers = analysis_data.get('answers') or []
            created_at_str = data.get('created_at')
            scheduled_call_str = analysis_answers[3] if len(analysis_answers) > 3 else None

            def parse_datetime_safe(date_str):
                try:
                    return datetime.fromisoformat(str(date_str)) if date_str else None
                except Exception as e:
                    logger.warning("Invalid datetime: %s", e)
                    return None
                
            campaign_thread_ID = get_campaign_thread_id(data)

            call_data = CallCreate(
                recording_url=str(data.get('recording_url',None)),
                user_id = metadata.get('user_id'),
                campaign_thread_id=str(campaign_thread_ID),
                contact_id=int(metadata.get('contact_id')),
                call_thread_id=thread_id,
                batch_id=data.get('batch_id'),
                followup_to_call_id=metadata_payload.get('followup_to_call_id'),
                call_id=call_id,
                
                is_followup=metadata_payload.get('is_followup', False),
                task=metadata.get('task'),
                
                created_at=parse_datetime_safe(created_at_str),
                is_call_scheduled=analysis_answers[2] if len(analysis_answers) > 2 else None,
                timezone=analysis_answers[4] if len(analysis_answers) > 4 else None,
                scheduled_call_datetime=parse_datetime_safe(scheduled_call_str) if scheduled_call_str and scheduled_call_str != 'None' else None,
                
                emotion=analysis_answers[1] if len(analysis_answers) > 1 else None,
                status=data.get('status', 'error'),
                summary=summary,
                
                from_phone=call_from,
                to_phone=call_to,
                
                call_transcript=str(transcript) 
            )


        except Exception as e:
            logger.exception("Error while preparing call_data: %s", e)


        if call_data.is_call_scheduled == True:
            data["to_phone"] = data["to"]
            if check_is_active_for_campaign(str(campaign_thread_ID),call_id,db):
                await schedule_next_call(data=SendCallRequest(**data),transcript=str(transcript),date = call_data.scheduled_call_datetime,followup_to_call_id=call_id)
            
        # print("All Scheduled Calls in database:")
        # for i in get_scheduled_call(db):
        #     print(i.call_id,i.to_phone,i.from_phone)

        try:
            result =  create_call(db,call_data)
            logger.info(f"✅ Inserted into PostgresDB with ID: {result.call_id}")
        except Exception as e:
            logger.error(f"❌ PostgresDB insert error: {e}")
            raise HTTPException(status_code=500, detail="Database error")
        try:
            campaign_data = CreateCampaignTable(
                user_id = metadata.get('user_id'),
                batch_id = data.get('batch_id'),
                campaign_thread_id=str(campaign_thread_ID),

                campaign_phone_number="+919953228138",

                business_name = metadata.get('business_name'),
                business_description = metadata.get('business_description'),
                business_website = metadata.get('business_website'),
                campaign_name = metadata.get('campaign_name'),

                agent_name = metadata.get('agent_name'),
                agent_voice = metadata.get('agent_voice'),
                agent_role = metadata.get('agent_role'),
                language = metadata.get('language'),

                task = metadata.get('task'),

                start_date = parse_datetime_safe(metadata.get('start_time')) if metadata.get('start_time',False) else parse_datetime_safe("2025-08-01T18:23:21.223Z"),
                end_date = parse_datetime_safe(metadata.get('end_time')),

                call_recording = data.get('record'),

                voicemail_message = metadata.get('voicemail_message'),
                voicemail_setting = metadata.get('voicemail_setting')
            )
            create_campaign(campaign_data, db)
        except Exception as e:
            logger.error("Could not add campaign %s",e)
        return {
            "status": "success", 
            "message": "Call processed successfully",
            "call_id": call_id,
            "analysis_available": analysis_data is not None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in webhook processing: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    