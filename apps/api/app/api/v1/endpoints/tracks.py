from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import (
    get_current_user,
    get_supabase_client,
    raise_supabase_api_error,
)
from app.clients.supabase import SupabaseApiError, SupabaseClient
from app.schemas.profile import CurrentUser
from app.schemas.track import TravelTrackCreate, TravelTrackResponse

router = APIRouter(prefix="/me/tracks", tags=["tracks"])


@router.get("", response_model=list[TravelTrackResponse])
async def list_travel_tracks(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> list[TravelTrackResponse]:
    try:
        tracks = await supabase.list_travel_tracks(user.id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return [TravelTrackResponse.model_validate(track) for track in tracks]


@router.post(
    "",
    response_model=TravelTrackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_travel_track(
    new_track: TravelTrackCreate,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TravelTrackResponse:
    try:
        track = await supabase.create_travel_track(
            user.id,
            new_track.model_dump(mode="json"),
        )
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TravelTrackResponse.model_validate(track)
