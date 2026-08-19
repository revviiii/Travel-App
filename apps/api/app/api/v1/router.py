from fastapi import APIRouter

from app.api.v1.endpoints import (
    goals,
    health,
    invitations,
    itineraries,
    maps,
    me,
    trip_places,
    trips,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(maps.router)
api_router.include_router(trips.router)
api_router.include_router(invitations.router)
api_router.include_router(goals.router)
api_router.include_router(trip_places.router)
api_router.include_router(itineraries.router)
