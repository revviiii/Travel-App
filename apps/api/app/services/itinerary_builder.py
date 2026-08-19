from collections import defaultdict
from collections.abc import Mapping, Sequence
from datetime import date, time

from app.schemas.itinerary import BuiltItinerary, BuiltItineraryItem


def build_itinerary(
    *,
    trip: Mapping[str, object],
    places: Sequence[Mapping[str, object]],
) -> BuiltItinerary:
    ordered_places = sorted(places, key=_schedule_key)
    first_date = _as_date(ordered_places[0]["scheduled_date"])
    positions_by_day: defaultdict[int, int] = defaultdict(int)
    schedule: list[BuiltItineraryItem] = []

    for place in ordered_places:
        scheduled_date = _as_date(place["scheduled_date"])
        day_number = (scheduled_date - first_date).days + 1
        positions_by_day[day_number] += 1
        votes = int(place.get("vote_count") or 0)
        required_votes = int(place.get("required_vote_count") or 1)
        vote_label = "vote" if votes == 1 else "votes"

        schedule.append(
            BuiltItineraryItem(
                trip_place_id=str(place["id"]),
                day_number=day_number,
                position=positions_by_day[day_number],
                start_time=_as_time(place["scheduled_time"]).strftime("%H:%M"),
                duration_minutes=int(place.get("duration_minutes") or 120),
                travel_time_from_previous_minutes=0,
                notes=f"{votes}/{required_votes} group {vote_label}",
            )
        )

    place_label = "place" if len(schedule) == 1 else "places"
    return BuiltItinerary(
        title=f"{trip['name']} itinerary",
        summary=(
            f"{len(schedule)} scheduled {place_label}, ordered by the dates and times "
            "chosen by the group."
        ),
        items=schedule,
    )


def _schedule_key(place: Mapping[str, object]) -> tuple[date, time, str]:
    return (
        _as_date(place["scheduled_date"]),
        _as_time(place["scheduled_time"]),
        str(place["id"]),
    )


def _as_date(value: object) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def _as_time(value: object) -> time:
    if isinstance(value, time):
        return value
    return time.fromisoformat(str(value))
