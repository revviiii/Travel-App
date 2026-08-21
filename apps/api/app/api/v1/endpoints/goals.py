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
)
from app.schemas.goal import TravelGoalCreate, TravelGoalResponse
from app.schemas.profile import CurrentUser

router = APIRouter(prefix="/me/goals", tags=["goals"])


@router.get("", response_model=list[TravelGoalResponse])
async def list_travel_goals(
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> list[TravelGoalResponse]:
    try:
        goals = await supabase.list_travel_goals(user.id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return [TravelGoalResponse.model_validate(goal) for goal in goals]


@router.post("", response_model=TravelGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_travel_goal(
    new_goal: TravelGoalCreate,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TravelGoalResponse:
    try:
        goal = await supabase.create_travel_goal(user.id, new_goal.goal_text)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return TravelGoalResponse.model_validate(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_travel_goal(
    goal_id: UUID,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> Response:
    try:
        await supabase.delete_travel_goal(goal_id)
    except SupabaseResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Travel goal was not found",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
