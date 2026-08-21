from datetime import date
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
    SupabaseItineraryAuthorizationError,
    SupabaseResourceNotFoundError,
)
from app.schemas.itinerary import ItineraryResponse
from app.schemas.profile import CurrentUser
from app.services.itinerary_builder import build_itinerary

router = APIRouter(prefix="/trips/{trip_id}/itinerary", tags=["itinerary"])


@router.get("", response_model=ItineraryResponse | None)
async def get_trip_itinerary(
    trip_id: UUID,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> ItineraryResponse | None:
    try:
        await supabase.get_trip(trip_id, user.id)
        itinerary = await supabase.get_trip_itinerary(trip_id, user.id)
    except SupabaseResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip was not found",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)

    return ItineraryResponse.model_validate(itinerary) if itinerary is not None else None


@router.post("/finalize", response_model=ItineraryResponse)
async def finalize_trip_itinerary(
    trip_id: UUID,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> ItineraryResponse:
    try:
        trip = await supabase.get_trip(trip_id, user.id)
        if trip["current_user_role"] not in {"owner", "admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only trip owners and admins can finalize an itinerary",
            )

        places = await supabase.list_trip_places(trip_id, user.id)
    except SupabaseResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip was not found",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)

    if not places:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Save at least one place before finalizing an itinerary",
        )
    if len(places) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shared itineraries currently support up to 100 saved places",
        )

    scheduled_dates = [date.fromisoformat(str(place["scheduled_date"])) for place in places]
    start_date = min(scheduled_dates)
    end_date = max(scheduled_dates)
    if (end_date - start_date).days >= 365:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The scheduled itinerary must fit within 365 days",
        )

    try:
        built = build_itinerary(
            trip=trip,
            places=places,
        )
        itinerary = await supabase.replace_trip_itinerary(
            trip_id,
            user.id,
            {
                "title": built.title,
                "summary": built.summary,
                "generation_method": "scheduled-proposals",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "items": [item.model_dump() for item in built.items],
            },
        )
    except SupabaseItineraryAuthorizationError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trip owners and admins can finalize an itinerary",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)

    return ItineraryResponse.model_validate(itinerary)
