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
from app.schemas.goal import GroupGoalResponse, TravelGoalCreate
from app.schemas.profile import CurrentUser

router = APIRouter(prefix="/trips/{trip_id}/goals", tags=["group goals"])


@router.get("", response_model=list[GroupGoalResponse])
async def list_group_goals(
    trip_id: UUID,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> list[GroupGoalResponse]:
    try:
        goals = await supabase.list_group_goals(trip_id)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return [GroupGoalResponse.model_validate(goal) for goal in goals]


@router.post("", response_model=GroupGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_group_goal(
    trip_id: UUID,
    new_goal: TravelGoalCreate,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> GroupGoalResponse:
    try:
        goal = await supabase.create_group_goal(trip_id, user.id, new_goal.goal_text)
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return GroupGoalResponse.model_validate(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group_goal(
    trip_id: UUID,
    goal_id: UUID,
    _user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> Response:
    try:
        await supabase.delete_group_goal(trip_id, goal_id)
    except SupabaseResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group goal was not found",
        ) from exc
    except SupabaseApiError as exc:
        raise_supabase_api_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
