from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dependencies import (
    get_current_user,
    get_supabase_client,
    raise_supabase_api_error,
)
from app.clients.supabase import (
    SupabaseApiError,
    SupabaseClient,
    SupabaseInvitationAuthorizationError,
    SupabaseResourceNotFoundError,
)
from app.schemas.profile import CurrentUser
from app.schemas.trip import (
    TripCreate,
    TripInvitationCreate,
    TripInvitationResponse,
    TripMemberResponse,
    TripResponse,
)

router = APIRouter(prefix="/trips", tags=["trips"])


def raise_trip_not_found(exc: SupabaseResourceNotFoundError) -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Trip was not found",
    ) from exc


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    new_trip: TripCreate,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripResponse:
    try:
        trip = await supabase.create_trip(user.id, new_trip.model_dump(mode="json"))
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripResponse.model_validate(trip)


@router.get("", response_model=list[TripResponse])
async def list_trips(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> list[TripResponse]:
    try:
        trips = await supabase.list_trips(user.id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return [TripResponse.model_validate(trip) for trip in trips]


@router.get("/{trip_id}", response_model=TripResponse)
async def read_trip(
    trip_id: UUID,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripResponse:
    try:
        trip = await supabase.get_trip(trip_id, user.id)
    except SupabaseResourceNotFoundError as exc:
        raise_trip_not_found(exc)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripResponse.model_validate(trip)


@router.get("/{trip_id}/members", response_model=list[TripMemberResponse])
async def list_trip_members(
    trip_id: UUID,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> list[TripMemberResponse]:
    try:
        members = await supabase.list_trip_members(trip_id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return [TripMemberResponse.model_validate(member) for member in members]


@router.post(
    "/{trip_id}/invitations",
    response_model=TripInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_trip_invitation(
    trip_id: UUID,
    invitation: TripInvitationCreate,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripInvitationResponse:
    try:
        created = await supabase.create_trip_invitation(
            trip_id,
            invitation.model_dump(mode="json"),
        )
    except SupabaseInvitationAuthorizationError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trip owners and admins can create invitations",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripInvitationResponse.model_validate(created)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: UUID,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> Response:
    try:
        await supabase.delete_trip(trip_id)
    except SupabaseResourceNotFoundError as exc:
        raise_trip_not_found(exc)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
