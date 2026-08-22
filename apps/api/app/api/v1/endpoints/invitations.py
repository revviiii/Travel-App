import re
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse

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

INVITE_TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9_-]{16,128}$")


def validate_invite_token(invite_token: str) -> None:
    if INVITE_TOKEN_PATTERN.fullmatch(invite_token) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is invalid, expired, or no longer active",
        )


@router.get("/{invite_token}/open", response_class=HTMLResponse, include_in_schema=False)
async def open_trip_invitation(invite_token: str) -> HTMLResponse:
    """Turn a normal HTTPS share URL into the app's registered deep link."""
    validate_invite_token(invite_token)
    deep_link = f"frontend://invite/{invite_token}"
    content = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0;url={deep_link}">
    <title>Open Pinara invitation</title>
    <style>
      body {{ font-family: system-ui, sans-serif; background: #fff9f1; color: #2a1008;
             display: grid; min-height: 100vh; place-items: center; margin: 0; }}
      main {{ max-width: 32rem; padding: 2rem; text-align: center; }}
      a {{ display: inline-block; margin-top: 1rem; padding: .8rem 1.2rem;
           border-radius: 999px; background: #d43a11; color: white; text-decoration: none; }}
    </style>
  </head>
  <body>
    <main>
      <h1>Open this group in Pinara</h1>
      <p>If Pinara did not open automatically, use the button below.</p>
      <a href="{deep_link}">Open Pinara</a>
    </main>
  </body>
</html>"""
    return HTMLResponse(
        content=content,
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )


@router.post("/{invite_token}/accept", response_model=TripResponse)
async def accept_trip_invitation(
    invite_token: str,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> TripResponse:
    validate_invite_token(invite_token)

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
