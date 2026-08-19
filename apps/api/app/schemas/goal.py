from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TravelGoalCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    goal_text: str = Field(min_length=1, max_length=100)


class TravelGoalResponse(BaseModel):
    id: UUID
    user_id: UUID
    goal_text: str
    created_at: datetime
