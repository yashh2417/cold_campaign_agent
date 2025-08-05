from app.core.config import settings
from fastapi import HTTPException
import requests
from app.core.database import logger
from app.crud.update import (
    soft_delete_contact
)


def stop_call_from_call_id(call_id):
    try:
        url = f"https://api.bland.ai/v1/calls/{call_id}/stop"
        bland_api_key = settings.BLAND_API_KEY

        if not bland_api_key:
            raise HTTPException(status_code=500, detail="BLAND_API_KEY not configured")

        headers = {
            "Authorization": f"Bearer {bland_api_key}",
            "Content-Type": "application/json"
        }
        logger.info(f"📞 Stopping call with call id:{call_id}")
        
        response = requests.post(url, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        logger.info(f"✅ Call stopped successfully: {result}")

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

def stop_batch_calls(batch_id):
    try:
        url = f'https://api.bland.ai/v2/batches/{batch_id}/stop'
        bland_api_key = settings.BLAND_API_KEY

        if not bland_api_key:
            raise HTTPException(status_code=500, detail="BLAND_API_KEY not configured")

        headers = {
            "Authorization": f"Bearer {bland_api_key}",
            "Content-Type": "application/json"
        }
        logger.info(f"📞 Stopping call with batch id:{batch_id}")
        
        response = requests.post(url, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        logger.info(f"✅ Batch stopped successfully: {result}")

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

def stop_all_calls():   
    bland_api_key = settings.BLAND_API_KEY
    headers = {
        "Authorization": f"Bearer {bland_api_key}",
        "Content-Type": "application/json"
        }
    url = f"https://us.api.bland.ai/v1/calls/active/stop"
    response = requests.post(url=url,headers=headers)
    response = response.json()
    return {"status":response["status"],
            "call":response["num_calls"]}

def stop_active_call_from_id(call_id):
    bland_api_key = settings.BLAND_API_KEY
    headers = {
        "Authorization": f"Bearer {bland_api_key}",
        "Content-Type": "application/json"
        }
    url = f"https://api.bland.ai/v1/calls/{call_id}/stop"
    response = requests.post(url=url,headers=headers)
    response = response.json()
    print(response,type(response))
    return response

def delete_contact(contact_id,db):
    soft_delete_contact(contact_id,db)
    return {"contact_id":contact_id,
            "is_active":False}