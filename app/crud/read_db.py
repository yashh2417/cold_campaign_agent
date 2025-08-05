from app.models.call_table import (
    Call,
    Campaign,
    Contact,
    User
)
from sqlalchemy import select


def check_is_active_for_campaign(campaign_thread_id,call_id,db):
    return db.execute(select(Call.is_active_for_campaign)
               .where(Call.campaign_thread_id == campaign_thread_id)
               .where(Call.call_id == call_id)).scalars().all()