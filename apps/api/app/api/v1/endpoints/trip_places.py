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
    SupabaseResourceNotFoundError,
    SupabaseTripPlaceAuthorizationError,
)
from app.schemas.profile import CurrentUser
from app.schemas.trip_place import TripPlaceCreate, TripPlaceResponse

router = APIRouter(prefix="/trips/{trip_id}/places", tags=["trip places"])


def raise_saved_place_not_found(exc: SupabaseResourceNotFoundError) -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Saved place was not found",
    ) from exc


@router.get("", response_model=list[TripPlaceResponse])
async def list_trip_places(
    trip_id: UUID,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> list[TripPlaceResponse]:
    try:
        await supabase.get_trip(trip_id, user.id)
        places = await supabase.list_trip_places(trip_id, user.id)
    except SupabaseResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip was not found",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return [TripPlaceResponse.model_validate(place) for place in places]


@router.post("", response_model=TripPlaceResponse, status_code=status.HTTP_201_CREATED)
async def save_trip_place(
    trip_id: UUID,
    new_place: TripPlaceCreate,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripPlaceResponse:
    try:
        trip = await supabase.get_trip(trip_id, user.id)
        if not new_place.voting_enabled and trip["current_user_role"] not in {
            "owner",
            "admin",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners and admins can disable group voting",
            )
        place = await supabase.save_trip_place(
            trip_id,
            user.id,
            new_place.model_dump(mode="json"),
        )
    except SupabaseTripPlaceAuthorizationError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except SupabaseResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip was not found",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripPlaceResponse.model_validate(place)


@router.delete("/{trip_place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip_place(
    trip_id: UUID,
    trip_place_id: UUID,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> Response:
    try:
        await supabase.delete_trip_place(trip_id, trip_place_id)
    except SupabaseResourceNotFoundError as exc:
        raise_saved_place_not_found(exc)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{trip_place_id}/vote", response_model=TripPlaceResponse)
async def add_trip_place_vote(
    trip_id: UUID,
    trip_place_id: UUID,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripPlaceResponse:
    try:
        existing_place = await supabase.get_trip_place(trip_id, trip_place_id, user.id)
        if not existing_place["voting_enabled"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Group voting is disabled for this place",
            )
        await supabase.add_trip_place_vote(trip_place_id, user.id)
        place = await supabase.get_trip_place(trip_id, trip_place_id, user.id)
    except SupabaseResourceNotFoundError as exc:
        raise_saved_place_not_found(exc)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripPlaceResponse.model_validate(place)


@router.delete("/{trip_place_id}/vote", response_model=TripPlaceResponse)
async def remove_trip_place_vote(
    trip_id: UUID,
    trip_place_id: UUID,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripPlaceResponse:
    try:
        await supabase.get_trip_place(trip_id, trip_place_id, user.id)
        await supabase.remove_trip_place_vote(trip_place_id, user.id)
        place = await supabase.get_trip_place(trip_id, trip_place_id, user.id)
    except SupabaseResourceNotFoundError as exc:
        raise_saved_place_not_found(exc)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TripPlaceResponse.model_validate(place)
