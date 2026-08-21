from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_current_user,
    get_supabase_client,
    raise_supabase_api_error,
)
from app.clients.supabase import (
    SupabaseApiError,
    SupabaseClient,
    SupabaseInvalidInvitationError,
)
from app.schemas.profile import CurrentUser
from app.schemas.trip import TripResponse

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("/{invite_token}/accept", response_model=TripResponse)
async def accept_trip_invitation(
    invite_token: str,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripResponse:
    if not 16 <= len(invite_token) <= 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is invalid, expired, or no longer active",
        )

    try:
        membership = await supabase.accept_trip_invitation(invite_token)
        trip = await supabase.get_trip(UUID(str(membership["trip_id"])), user.id)
    except SupabaseInvalidInvitationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is invalid, expired, or no longer active",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripResponse.model_validate(trip)
