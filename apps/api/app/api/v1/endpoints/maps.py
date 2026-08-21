from typing import Annotated, NoReturn

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_current_user,
    get_google_places_client,
    get_google_routes_client,
    get_maps_rate_limiter,
)
from app.clients.google_places import GooglePlacesClient
from app.clients.google_routes import GoogleRoutesClient
from app.core.config import Settings, get_settings
from app.schemas.google_maps import (
    ComputedRouteResponse,
    NearbyPlacesRequest,
    NearbyPlacesResponse,
    NearbySearchQuery,
    RouteQuery,
)
from app.schemas.profile import CurrentUser
from app.services.google_maps import (
    normalize_places,
    normalize_route,
    place_types_for_preferences,
)
from app.services.rate_limit import RateLimitExceededError, SlidingWindowRateLimiter

router = APIRouter(prefix="/maps", tags=["maps"])


async def enforce_provider_limit(
    limiter: SlidingWindowRateLimiter,
    user: CurrentUser,
    scope: str,
    maximum_requests: int,
) -> None:
    try:
        await limiter.check(str(user.id), scope, maximum_requests)
    except RateLimitExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many map requests. Please wait before trying again.",
            headers={"Retry-After": str(exc.retry_after_seconds)},
        ) from exc


def raise_google_api_error(exc: httpx.HTTPError) -> NoReturn:
    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Maps quota is temporarily unavailable",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Google Maps could not complete the request",
    ) from exc


@router.post("/places/nearby", response_model=NearbyPlacesResponse)
async def search_nearby_places(
    request: NearbyPlacesRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    google_places: Annotated[GooglePlacesClient, Depends(get_google_places_client)],
    limiter: Annotated[SlidingWindowRateLimiter, Depends(get_maps_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> NearbyPlacesResponse:
    await enforce_provider_limit(
        limiter,
        user,
        "google-places",
        settings.google_places_requests_per_minute,
    )
    query = NearbySearchQuery(
        center=request.center,
        radius_meters=request.radius_meters,
        included_types=place_types_for_preferences(request.preference_keys),
        max_result_count=request.max_result_count,
        rank_preference=request.rank_preference,
    )

    try:
        payload = await google_places.search_nearby(query)
    except httpx.HTTPError as exc:
        raise_google_api_error(exc)

    return normalize_places(payload, request.center, request.radius_meters)


@router.post("/routes/compute", response_model=ComputedRouteResponse)
async def compute_route(
    request: RouteQuery,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    google_routes: Annotated[GoogleRoutesClient, Depends(get_google_routes_client)],
    limiter: Annotated[SlidingWindowRateLimiter, Depends(get_maps_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ComputedRouteResponse:
    await enforce_provider_limit(
        limiter,
        user,
        "google-routes",
        settings.google_routes_requests_per_minute,
    )
    try:
        payload = await google_routes.compute_route(request)
    except httpx.HTTPError as exc:
        raise_google_api_error(exc)

    try:
        return normalize_route(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
