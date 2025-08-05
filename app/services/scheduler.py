from app.core.database import logger
from app.services.utils import format_datetime
from app.schemas.call import SendCallRequest
from app.services.create import create_single_call


async def schedule_next_call(data: SendCallRequest,transcript, date, followup_to_call_id):
    print('After Validation Data:')
    payload = data.model_dump()
    previous_call_transcript = transcript
    print(previous_call_transcript)
    prompt = f'''
You are a highly skilled, articulate, and friendly AI caller representing a business.

You will be provided with the following:
- Business Name: {data.metadata['business_name']}
- Business Description: {data.metadata['business_description']}
- Task Objective: {data.metadata['task_description']}
- Customer Name: {data.metadata['customer_name']}
- Customer Email: {data.metadata['cust_email']}

If available, you will also be given a transcript of a previous call with {data.metadata['customer_name']} for context:
Previous Call Transcript:
"""
{previous_call_transcript}
"""

Your objective is to conduct a natural, professional phone conversation with {data.metadata['customer_name']} to achieve the task goal. Keep the tone warm, confident, and helpful — not robotic or pushy.

Guidelines:
- Begin with a polite introduction, mentioning you're calling on behalf of {data.metadata['business_name']}.
- If relevant, briefly acknowledge the previous conversation or follow up on any pending discussion.
- Clearly explain the value of the service.
- Stay focused on the task (e.g., offering details, proposing a meeting).
- Use the customer’s name naturally.
- Offer to send info to {data.metadata['cust_email']} if helpful.
- If the customer is busy, offer to reschedule politely.
- Keep it concise and human.

Avoid outputting any metadata, summaries, or JSON — only speak the dialogue.
'''

    payload['start_time'] = format_datetime(date)
    payload['metadata'] = {
        "task":prompt,
        "previous_call_transcript":previous_call_transcript,
        "is_followup": True,
        "followup_to_call_id": followup_to_call_id
    }
    payload["task"] = prompt
    payload["request_data"] = {
        "business_name": data.metadata['business_name'],
        "business_description": data.metadata['business_description'],
        "task_description": data.metadata['task_description'],
        "customer_name": data.metadata['customer_name'],
        "cust_email": data.metadata['cust_email']
    }
    print('Giving scheduled call payload:', payload)

    # Create SendCallRequest instance
    request_obj = SendCallRequest(**payload)
    
    # Direct async call
    result = await create_single_call(request_obj)
    
    logger.info(f"Scheduled call id: {result.get('call_id', None)} from call id: {followup_to_call_id}")