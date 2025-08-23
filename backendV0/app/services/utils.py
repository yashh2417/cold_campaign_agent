from datetime import datetime
import pytz
import json
from app.core.config import settings
import google.generativeai as genai
from app.core.database import logger

def parse_datetime_safe(date_str):
    """Safely parses an ISO datetime string."""
    if not date_str or date_str in ['None', 'null']:
        return None
    try:
        # Handles both 'Z' and '+00:00' UTC formats
        return datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
    except (ValueError, TypeError):
        logger.warning(f"Could not parse invalid datetime: {date_str}")
        return None

def llm_generate_data(data):
    call_date = data.get('created_at')
    call_transcript = data.get('concatenated_transcript')

    prompt = f"""
    You are an AI assistant that analyzes customer service call transcripts. Based on the transcript and the call date, extract the following details:

    1. Customer Reaction: Categorize the customer's overall reaction to the product as one of: Positive, Negative, or Neutral.
    2. Next Call Scheduled Datetime: Extract the date and time of the next scheduled call, if mentioned. Format it as an ISO 8601 string (e.g., "2025-07-19T15:00:00").
    3. Timezone: The timezone associated with the next scheduled call, if available (e.g., "Asia/Kolkata", "UTC", etc.). If not explicitly mentioned, infer from context or return Unknown.
    4. Is Call Scheduled?: Return True if a follow-up call is scheduled, otherwise False.

    Input:
    Call Date: {call_date}
    Transcript:
    '''
    {call_transcript}
    '''

    Output Format (in JSON):
    {{
    "customer_reaction": "<Positive/Negative/Neutral>",
    "next_call_datetime": "<ISO_8601_datetime_or_null>",
    "timezone": "<timezone_or_unknown>",
    "is_call_scheduled": <true_or_false>
    }}
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    answer = response.text.strip('```').lstrip('json')
    print(answer)
    data = json.loads(answer)
    print("JSON:", json.loads(answer))
    print(data)
    return data

def serialize_datetimes(obj):
    if isinstance(obj, datetime):
        return obj.isoformat().replace('+00:00', 'Z')
    elif isinstance(obj, dict):
        return {k: serialize_datetimes(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_datetimes(i) for i in obj]
    return obj