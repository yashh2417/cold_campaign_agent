# import json
# from datetime import timedelta
# from app.core.database import logger
# from app.services.utils import llm_generate_data,format_datetime
# from fastapi import Request,HTTPException
# from app.core.config import settings
# from sqlalchemy.orm import Session
# import requests
# from app.crud.get_data import (
#     get_call_thread_id,
#     get_scheduled_call,
#     get_campaign_thread_id
# )

# from app.crud.create_db import (
#     create_call,
#     create_campaign
# )
# from app.schemas.campaign import CreateCampaignTable
# from app.services.scheduler import schedule_next_call
# from app.schemas.call import (
#     CallCreate, 
#     SendCallRequest
# )
# from app.crud.read_db import check_is_active_for_campaign
# from app.schemas.campaign import CreateCampaignForm
# # from app.services.tasks import schedule_next_call
# from datetime import datetime

# def is_active_for_campaign(campaign_thread_id,call_id,db):
#     return bool(check_is_active_for_campaign(campaign_thread_id,call_id,db))


# # def analysis_endpoint(call_id,llm_data):
# #     # Call Bland AI analysis endpoint
# #     analysis_data = None
# #     bland_api_key = settings.BLAND_API_KEY
    
# #     if bland_api_key and call_id:
# #         try:
# #             headers = {"Authorization": f"Bearer {bland_api_key}"}
# #             analysis_url = f"https://api.bland.ai/v1/calls/{call_id}/analyze"
# #             analysis_payload = {
# #                 "goal": "Understand the customer's interest in the product and pay attention to whether they want to schedule another call",
# #                 "questions": [
# #                     ["Did customer answer","boolean"],
# #                     ["what was the customer's reaction to the product", " 'positive' or 'negative' or 'neutral' "],
# #                     ["Is call scheduled, Return True if a follow-up call is scheduled, otherwise False.", "boolean"],
# #                     ["Next Call Schedule Data, give timestamp if specified,Extract the date and time of the next scheduled call, if mentioned. Format it as an ISO 8601 string (e.g., '2025-07-19T15:00:00').","string"],
# #                     ["Next Call Schedule Data, give Timezone if specified","string"]
# #                 ]
# #             }

# #             analysis_response = requests.post(
# #                 analysis_url, 
# #                 json=analysis_payload, 
# #                 headers=headers,
# #                 timeout=30
# #             )
            
# #             if analysis_response.status_code == 200:
# #                 analysis_data =  analysis_response.json()
# #                 logger.info(f"📊 Analysis successful: {analysis_data}")
# #                 logger.info(f"📊 LLM Data: {llm_data}")
# #                 return analysis_data
# #             else:
# #                 logger.error(f"❌ Analysis API error: {analysis_response.status_code} - {analysis_response.text}")
                
# #         except requests.exceptions.RequestException as e:
# #             logger.error(f"❌ Analysis request failed: {e}")
# #         except Exception as e:
# #             logger.error(f"❌ Analysis processing error: {e}")





# async def get_postcall_data(request: Request, db: Session):
#     """Receive and process webhook callbacks from Bland AI"""
#     try:
#         data =  await request.json()
#         llm_data = llm_generate_data(data)
#         logger.info(f"📥 Incoming Webhook Payload: {data}")


#         call_id = str(data.get("call_id"))
#         transcript = str(data.get("concatenated_transcript"))
#         summary = str(data.get("summary"))
#         call_to = str(data.get("to"))
#         call_from = str(data.get("from"))

#         logger.info(f"🆔 Call ID: {call_id}")
#         logger.info(f"📄 Summary: {summary}")
        

#         if not call_id:
#             logger.error("❌ Missing call_id in webhook payload")
#             raise HTTPException(status_code=400, detail="Missing call_id")

#         if not isinstance(transcript, str):
#             logger.error("❌ Invalid transcript format")
#             raise HTTPException(status_code=400, detail="Invalid transcript format")
        
#         logger.info(f"📝 Transcript Text: {transcript}")

#         analysis_data=llm_data


#         try:
#             print('Batch ID:', data.get('batch_id'))

#             metadata_payload = data.get('metadata', {})
#             thread_id = get_call_thread_id(db=db, data=data)

#             print("Thread ID:", thread_id, type(thread_id))

#             # variables = data.get('variables',{})
#             # var_metadata = variables.get('metadata',{})
#             metadata = data.get('metadata',{})

#             # Handle campaign changes
#             changes = metadata.get('changes')
#             if changes and changes != "{}" and isinstance(changes, str):
#                 try:
#                     import json
#                     changes_dict = json.loads(changes)
#                     changes_dict.pop('campaign_id', None)  # Remove if exists
#                     changes_dict['batch_id'] = data.get('batch_id')
#                     campaign_data = CreateCampaignTable(**changes_dict)
#                     create_campaign(campaign_data, db)
#                 except Exception as e:
#                     logger.warning("Failed to create campaign from changes: %s", e)
#             # changes = metadata.get('changes')
#             # if changes!="{}" and isinstance(changes, str):
#             #     changes.pop('campaign_id', None)
#             #     changes['batch_id'] = data.get('batch_id')
#             #     try:
#             #         campaign_data = CreateCampaignTable(**changes)
#             #         create_campaign(campaign_data, db)
#             #     except Exception as e:
#             #         logger.warning("Failed to create campaign: %s", e)
            

#             # # Process call creation
#             # analysis_answers = analysis_data.get('answers') or []
#             # created_at_str = data.get('created_at')
#             # scheduled_call_str = analysis_answers[3] if len(analysis_answers) > 3 else None

#             def parse_datetime_safe(date_str):
#                 try:
#                     if date_str and date_str != 'None' and date_str != 'null':
#                         return datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
#                     return None
#                 except Exception as e:
#                     logger.warning("Invalid datetime: %s", e)
#                     return None
                
#             campaign_thread_ID = get_campaign_thread_id(data)

#             call_duration_str = "N/A"
#             # try:
#             #     bland_api_key = settings.BLAND_API_KEY
#             #     headers = {"Authorization": f"Bearer {bland_api_key}"}
#             #     url = f"https://api.bland.ai/v1/calls/{call_id}"
                
#             #     response = requests.get(url, headers=headers, timeout=10)
#             #     response.raise_for_status()
                
#             #     call_details = response.json()
#             #     call_length_minutes = call_details.get("call_length") # Duration in minutes

#             #     if call_length_minutes is not None:
#             #         # Convert minutes to a more readable format (e.g., "2m 15s")
#             #         total_seconds = int(call_length_minutes * 60)
#             #         minutes, seconds = divmod(total_seconds, 60)
#             #         call_duration_str = f"{minutes}m {seconds}s"

#             # except requests.exceptions.RequestException as e:
#             #     logger.error(f"❌ Failed to fetch call details from Bland AI: {e}")

#             try:
#                 bland_api_key = settings.BLAND_API_KEY
#                 if bland_api_key:
#                     headers = {"Authorization": f"Bearer {bland_api_key}"}
#                     url = f"https://api.bland.ai/v1/calls/{call_id}"
                    
#                     response = requests.get(url, headers=headers, timeout=10)
#                     if response.status_code == 200:
#                         call_details = response.json()
#                         call_length_minutes = call_details.get("call_length")
#                         if call_length_minutes is not None:
#                             total_seconds = int(call_length_minutes * 60)
#                             minutes, seconds = divmod(total_seconds, 60)
#                             call_duration_str = f"{minutes}m {seconds}s"
#             except Exception as e:
#                 logger.error(f"❌ Failed to fetch call details: {e}")

#             # FIX: Access llm_data correctly
#             customer_reaction = llm_data.get('customer_reaction', 'Neutral')
#             is_call_scheduled = llm_data.get('is_call_scheduled', False)
#             next_call_datetime = llm_data.get('next_call_datetime')
#             timezone_info = llm_data.get('timezone', 'Unknown')

#             call_data = CallCreate(
#                 recording_url=str(data.get('recording_url',None)),
#                 user_id = metadata.get('user_id'),
#                 campaign_thread_id=str(campaign_thread_ID),
#                 contact_id=int(metadata.get('contact_id')),
#                 call_thread_id=thread_id,
#                 batch_id=data.get('batch_id'),
#                 followup_to_call_id=metadata_payload.get('followup_to_call_id'),
#                 call_id=call_id,
#                 call_duration=call_duration_str,
#                 is_followup=metadata_payload.get('is_followup', False),
#                 task=metadata.get('task'),
                
#                 created_at=parse_datetime_safe(created_at_str),
#                 is_call_scheduled=analysis_answers[1] if len(analysis_answers) > 2 else None,
#                 timezone=analysis_answers[3] if len(analysis_answers) > 4 else None,
#                 scheduled_call_datetime=parse_datetime_safe(scheduled_call_str) if scheduled_call_str and scheduled_call_str != 'None' else None,
                
#                 emotion=analysis_answers[0] if len(analysis_answers) > 1 else None,
#                 status=data.get('status', 'error'),
#                 summary=summary,
                
#                 from_phone=call_from,
#                 to_phone=call_to,
                
#                 call_transcript=str(transcript) 
#             )


#         except Exception as e:
#             logger.exception("Error while preparing call_data: %s", e)


#         if call_data.is_call_scheduled == True:
#             data["to_phone"] = data["to"]
#             if check_is_active_for_campaign(str(campaign_thread_ID),call_id,db):
#                 await schedule_next_call(data=SendCallRequest(**data),transcript=str(transcript),date = call_data.scheduled_call_datetime,followup_to_call_id=call_id)
            
#         # print("All Scheduled Calls in database:")
#         # for i in get_scheduled_call(db):
#         #     print(i.call_id,i.to_phone,i.from_phone)

#         try:
#             result =  create_call(db,call_data)
#             logger.info(f"✅ Inserted into PostgresDB with ID: {result.call_id}")
#         except Exception as e:
#             logger.error(f"❌ PostgresDB insert error: {e}")
#             raise HTTPException(status_code=500, detail="Database error")
#         try:
#             batch_id = data.get('batch_id')
#             if batch_id:
#                 start_time = metadata.get('start_time')
#                 campaign_data = CreateCampaignTable(
#                     user_id = metadata.get('user_id'),
#                     batch_id = batch_id,
#                     campaign_thread_id=str(campaign_thread_ID),

#                     campaign_phone_number="+919953228138",

#                     business_name = metadata.get('business_name'),
#                     business_description = metadata.get('business_description'),
#                     business_website = metadata.get('business_website'),
#                     campaign_name = metadata.get('campaign_name'),

#                     agent_name = metadata.get('agent_name'),
#                     agent_voice = metadata.get('agent_voice'),
#                     agent_role = metadata.get('agent_role'),
#                     language = metadata.get('language'),

#                     task = metadata.get('task'),

#                     start_date=parse_datetime_safe(start_time) if start_time else datetime.now(),
#                     end_date = parse_datetime_safe(metadata.get('end_time')),

#                     call_recording = data.get('record'),

#                     voicemail_message = metadata.get('voicemail_message'),
#                     voicemail_setting = metadata.get('voicemail_setting')
#                 )
#                 create_campaign(campaign_data, db)

#             else:
#                 logger.error("Could not create campaign, batch_id is missing from webhook data.")
#         except Exception as e:
#             logger.error("Could not add campaign %s",e)
#         return {
#             "status": "success", 
#             "message": "Call processed successfully",
#             "call_id": call_id,
#             "analysis_available": analysis_data is not None
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Unexpected error in webhook processing: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")
    
from app.core.database import logger
from app.services.utils import llm_generate_data,format_datetime
from fastapi import Request,HTTPException
from app.core.config import settings
from sqlalchemy.orm import Session
import requests
import json  # Add this import
from datetime import datetime, timedelta  # Add timedelta
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
from datetime import datetime

def is_active_for_campaign(campaign_thread_id,call_id,db):
    return bool(check_is_active_for_campaign(campaign_thread_id,call_id,db))

async def get_postcall_data(request: Request, db: Session):
    """Receive and process webhook callbacks from Bland AI"""
    logger.info("🔔 WEBHOOK CALLED - Bland AI is sending data")
    try:
        data = await request.json()
        logger.info(f"📥 Raw webhook data received: {json.dumps(data, indent=2, default=str)}")
        
        # FIX: llm_generate_data is not async, don't await it
        llm_data = llm_generate_data(data)
        logger.info(f"🤖 LLM Analysis Result: {llm_data}")
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

        analysis_data = llm_data

        try:
            print('Batch ID:', data.get('batch_id'))

            metadata_payload = data.get('metadata', {})
            thread_id = get_call_thread_id(db=db, data=data)

            print("Thread ID:", thread_id, type(thread_id))

            metadata = data.get('metadata', {})

            # Handle campaign changes - FIX: Parse JSON string properly
            changes = metadata.get('changes')
            if changes and changes != "{}" and isinstance(changes, str):
                try:
                    import json
                    changes_dict = json.loads(changes)
                    changes_dict.pop('campaign_id', None)  # Remove if exists
                    changes_dict['batch_id'] = data.get('batch_id')
                    campaign_data = CreateCampaignTable(**changes_dict)
                    create_campaign(campaign_data, db)
                except Exception as e:
                    logger.warning("Failed to create campaign from changes: %s", e)

            def parse_datetime_safe(date_str):
                try:
                    if date_str and date_str != 'None' and date_str != 'null':
                        return datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
                    return None
                except Exception as e:
                    logger.warning("Invalid datetime: %s", e)
                    return None

            campaign_thread_ID = get_campaign_thread_id(data)

            # FIX: Get call duration properly
            call_duration_str = "N/A"
            try:
                bland_api_key = settings.BLAND_API_KEY
                if bland_api_key:
                    headers = {"Authorization": f"Bearer {bland_api_key}"}
                    url = f"https://api.bland.ai/v1/calls/{call_id}"
                    
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        call_details = response.json()
                        call_length_minutes = call_details.get("call_length")
                        if call_length_minutes is not None:
                            total_seconds = int(call_length_minutes * 60)
                            minutes, seconds = divmod(total_seconds, 60)
                            call_duration_str = f"{minutes}m {seconds}s"
            except Exception as e:
                logger.error(f"❌ Failed to fetch call details: {e}")

            # FIX: Access llm_data correctly
            customer_reaction = llm_data.get('customer_reaction', 'Neutral')
            is_call_scheduled = llm_data.get('is_call_scheduled', False)
            next_call_datetime = llm_data.get('next_call_datetime')
            timezone_info = llm_data.get('timezone', 'Unknown')

            call_data = CallCreate(
                recording_url=str(data.get('recording_url', '')),
                user_id=metadata.get('user_id'),
                campaign_thread_id=str(campaign_thread_ID),
                contact_id=int(metadata.get('contact_id', 0)),
                call_thread_id=thread_id,
                batch_id=data.get('batch_id'),
                followup_to_call_id=metadata_payload.get('followup_to_call_id'),
                call_id=call_id,
                call_duration=call_duration_str,
                is_followup=metadata_payload.get('is_followup', False),
                task=metadata.get('task'),
                created_at=parse_datetime_safe(data.get('created_at')),
                is_call_scheduled=is_call_scheduled,
                timezone=timezone_info,
                scheduled_call_datetime=parse_datetime_safe(next_call_datetime),
                emotion=customer_reaction,
                status=data.get('status', 'completed'),
                summary=summary,
                from_phone=call_from,
                to_phone=call_to,
                call_transcript=str(transcript),
                recording=data.get('record', True)  # Add this field
            )

        except Exception as e:
            logger.exception("Error while preparing call_data: %s", e)
            raise HTTPException(status_code=500, detail=f"Error preparing call data: {str(e)}")

        # FIX: Schedule follow-up call logic
        if call_data.is_call_scheduled and call_data.scheduled_call_datetime:
            try:
                data["to_phone"] = data.get("to", call_to)
                if check_is_active_for_campaign(str(campaign_thread_ID), call_id, db):
                    await schedule_next_call(
                        data=SendCallRequest(**data),
                        transcript=str(transcript),
                        date=call_data.scheduled_call_datetime,
                        followup_to_call_id=call_id
                    )
            except Exception as e:
                logger.error(f"❌ Failed to schedule follow-up call: {e}")

        # FIX: Database insertion with better error handling
        try:
            result = create_call(db, call_data)
            logger.info(f"✅ Inserted into PostgresDB with ID: {result.call_id}")
        except Exception as e:
            logger.error(f"❌ PostgresDB insert error: {e}")
            # Log the actual call_data for debugging
            logger.error(f"Call data that failed: {call_data.model_dump()}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        # FIX: Campaign creation logic
        try:
            batch_id = data.get('batch_id')
            if batch_id and not metadata.get('changes'):  # Only create if not an update
                start_time = metadata.get('start_time')
                end_time = metadata.get('end_time')
                
                campaign_data = CreateCampaignTable(
                    user_id=metadata.get('user_id'),
                    batch_id=batch_id,
                    campaign_thread_id=str(campaign_thread_ID),
                    campaign_phone_number="+919953228138",
                    business_name=metadata.get('business_name'),
                    business_description=metadata.get('business_description'),
                    business_website=metadata.get('business_website'),
                    campaign_name=metadata.get('campaign_name', 'Default Campaign'),
                    agent_name=metadata.get('agent_name'),
                    agent_voice=metadata.get('agent_voice'),
                    agent_role=metadata.get('agent_role'),
                    language=metadata.get('language'),
                    task=metadata.get('task'),
                    start_date=parse_datetime_safe(start_time) or datetime.now(),
                    end_date=parse_datetime_safe(end_time) or (datetime.now() + timedelta(hours=1)),
                    call_recording=data.get('record', True),
                    voicemail_message=metadata.get('voicemail_message'),
                    voicemail_setting=metadata.get('voicemail_setting', False)
                )
                create_campaign(campaign_data, db)
                logger.info(f"✅ Campaign created for batch_id: {batch_id}")
            else:
                logger.info("Campaign creation skipped - no batch_id or is update")
        except Exception as e:
            logger.error(f"Could not add campaign: {e}")

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