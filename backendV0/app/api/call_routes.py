from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.schemas.call import(
    TestCallForm,
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
    create_batch_call,
    make_test_call
)

from app.services.get_services import (
    get_calls_from_db,
    get_call_from_id,
    get_call_recording_by_id,
    call_history_from_userID
    )

from app.core.dependencies import (
    get_db,
    get_current_user,
    create_response,
    create_response_with_status
)

router = APIRouter(tags=["calls"])

@router.post('/call/call-history')
def call_history_by_userID(campaign_thread_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = call_history_from_userID(campaign_thread_id, user.user_id, db)
    return create_response(data, user.user_id)

@router.get("/call/recording-url/{call_id}")
def get_call_recording(call_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = get_call_recording_by_id(call_id, db, user.user_id)
    return create_response(data, user.user_id)

@router.post("/call/test-call")
async def test_call(request: TestCallForm, user=Depends(get_current_user), db: Session = Depends(get_db)):
    data = await make_test_call(user.user_id, request, db)
    return create_response(data, user.user_id)

@router.delete('/call/stop/{call_id}')
def stop_call(call_id: str, user=Depends(get_current_user)):
    data = stop_call_from_call_id(call_id)
    return create_response_with_status(data, user.user_id, "success", f"Call {call_id} stopped successfully")