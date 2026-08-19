from collections.abc import AsyncIterator
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.clients.google_places import GooglePlacesClient
from app.clients.google_routes import GoogleRoutesClient
from app.clients.supabase import (
    SupabaseApiError,
    SupabaseAuthenticationError,
    SupabaseClient,
)
from app.core.config import Settings, get_settings
from app.schemas.profile import CurrentUser

bearer_scheme = HTTPBearer(auto_error=False)


async def get_http_client() -> AsyncIterator[httpx.AsyncClient]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        yield client


def get_google_places_client(
    settings: Annotated[Settings, Depends(get_settings)],
    http_client: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> GooglePlacesClient:
    if settings.google_maps_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Maps is not configured",
        )

    return GooglePlacesClient(
        api_key=settings.google_maps_api_key.get_secret_value(),
        http_client=http_client,
    )


def get_google_routes_client(
    settings: Annotated[Settings, Depends(get_settings)],
    http_client: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> GoogleRoutesClient:
    if settings.google_maps_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Maps is not configured",
        )

    return GoogleRoutesClient(
        api_key=settings.google_maps_api_key.get_secret_value(),
        http_client=http_client,
    )


def get_access_token(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Supabase access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_supabase_client(
    access_token: Annotated[str, Depends(get_access_token)],
    settings: Annotated[Settings, Depends(get_settings)],
    http_client: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> SupabaseClient:
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured",
        )

    return SupabaseClient(
        base_url=settings.supabase_url,
        publishable_key=settings.supabase_publishable_key,
        access_token=access_token,
        http_client=http_client,
    )


async def get_current_user(
    supabase: Annotated[SupabaseClient, Depends(get_supabase_client)],
) -> CurrentUser:
    try:
        return await supabase.get_current_user()
    except SupabaseAuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except SupabaseApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


def raise_supabase_api_error(exc: SupabaseApiError) -> None:
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=str(exc),
    ) from exc
