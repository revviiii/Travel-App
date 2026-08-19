from app.services.itinerary_builder import build_itinerary


def scheduled_place(
    place_id: str,
    *,
    scheduled_date: str,
    scheduled_time: str,
    votes: int = 1,
    required_votes: int = 2,
) -> dict[str, object]:
    return {
        "id": place_id,
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "duration_minutes": 120,
        "vote_count": votes,
        "required_vote_count": required_votes,
    }


def test_builder_orders_places_by_the_users_chosen_date_and_time() -> None:
    result = build_itinerary(
        trip={"name": "Museum Weekend"},
        places=[
            scheduled_place(
                "day-two",
                scheduled_date="2026-08-23",
                scheduled_time="09:00:00",
            ),
            scheduled_place(
                "day-one-late",
                scheduled_date="2026-08-22",
                scheduled_time="14:00:00",
            ),
            scheduled_place(
                "day-one-early",
                scheduled_date="2026-08-22",
                scheduled_time="10:30:00",
            ),
        ],
    )

    assert [item.trip_place_id for item in result.items] == [
        "day-one-early",
        "day-one-late",
        "day-two",
    ]
    assert [item.day_number for item in result.items] == [1, 1, 2]
    assert [item.position for item in result.items] == [1, 2, 1]
    assert result.items[0].start_time == "10:30"
