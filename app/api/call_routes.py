from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.schemas.call import(
    SendCallRequest,
    BatchCallRequest
)
from app.services.stop_delete import(
    stop_call_from_call_id,
    stop_batch_calls,
    stop_active_call_from_id
)
from app.services.create import (
    create_single_call,
    create_batch_call
)


from app.services.get_services import (
    get_calls_from_db,
    get_call_from_id,
    get_call_recording_by_id,
    call_history_from_userID
    )

from app.core.dependencies import (
    get_db,
    get_current_user
)

router = APIRouter(tags=["calls"])


@router.get("/calls")
async def get_calls(limit: int = 50, skip: int = 0,db: Session = Depends(get_db)):
    return await get_calls_from_db(limit, skip, db)

@router.get("/calls/{call_id}")
async def get_single_call(call_id:str,db:Session = Depends(get_db)):
    return await get_call_from_id(call_id,db)

@router.post('/call/call-history')
def call_history_by_userID(campaign_thread_id:str,user = Depends(get_current_user),db:Session = Depends(get_db)):
    return call_history_from_userID(campaign_thread_id,user.user_id,db)

@router.get("/call-recording/{call_id}")
async def get_call_recording(call_id:str):
    return await get_call_recording_by_id(call_id)


@router.post("/bland/sendcall")
async def send_call(request: SendCallRequest):
    return await create_single_call(request)

@router.post("/bland/sendbatch")
async def send_batch(request: BatchCallRequest):
    return await create_batch_call(request)


@router.post("/stop-active-calls/{call_id}")
def stop_active_call_by_id(call_id:str):
    return stop_active_call_from_id(call_id)



@router.delete('/stop/call/{call_id}')
def stop_call(call_id:str):
    return stop_call_from_call_id(call_id)

@router.delete('/stop/batch/{batch_id}')
def stop_batch(batch_id:str):
    return stop_batch_calls(batch_id)