from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_current_user,
    get_supabase_client,
    raise_supabase_api_error,
)
from app.clients.supabase import SupabaseApiError, SupabaseClient
from app.schemas.profile import (
    CurrentUser,
    PreferencesResponse,
    PreferencesUpdate,
    ProfileResponse,
    ProfileUpdate,
)

router = APIRouter(prefix="/me", tags=["profile"])


@router.get("", response_model=ProfileResponse)
async def read_profile(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> ProfileResponse:
    try:
        profile = await supabase.get_profile(user.id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return ProfileResponse.model_validate(profile)


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    update: ProfileUpdate,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> ProfileResponse:
    values = update.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least one profile field is required",
        )

    try:
        profile = await supabase.update_profile(user.id, values)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return ProfileResponse.model_validate(profile)


@router.get("/preferences", response_model=PreferencesResponse)
async def read_preferences(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> PreferencesResponse:
    try:
        preference_keys = await supabase.get_preferences(user.id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return PreferencesResponse(preference_keys=preference_keys)


@router.put("/preferences", response_model=PreferencesResponse)
async def replace_preferences(
    update: PreferencesUpdate,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> PreferencesResponse:
    try:
        preference_keys = await supabase.replace_preferences(update.preference_keys)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return PreferencesResponse(preference_keys=preference_keys)
