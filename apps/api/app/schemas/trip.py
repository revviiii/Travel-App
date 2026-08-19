from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

TripStatus = Literal["planning", "active", "completed", "cancelled"]
TripRole = Literal["owner", "admin", "member"]


class TripCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)
    destination_name: str | None = Field(default=None, max_length=200)
    destination_latitude: float | None = Field(default=None, ge=-90, le=90)
    destination_longitude: float | None = Field(default=None, ge=-180, le=180)
    start_date: date | None = None
    end_date: date | None = None
    budget: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class TripResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    owner_id: UUID
    name: str
    destination_name: str | None = None
    destination_latitude: float | None = None
    destination_longitude: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget: Decimal | None = None
    status: TripStatus
    member_count: int = Field(ge=1)
    current_user_role: TripRole
    created_at: datetime
    updated_at: datetime


class TripMemberResponse(BaseModel):
    user_id: UUID
    role: TripRole
    joined_at: datetime


def default_invitation_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=7)


class TripInvitationCreate(BaseModel):
    expires_at: datetime = Field(default_factory=default_invitation_expiry)
    maximum_uses: int = Field(default=1, ge=1, le=100)


class TripInvitationResponse(BaseModel):
    id: UUID
    trip_id: UUID
    created_by: UUID
    invite_token: str
    expires_at: datetime | None = None
    maximum_uses: int | None = None
    use_count: int = Field(ge=0)
    is_active: bool
    created_at: datetime
