import { supabase } from '@/lib/supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PreferenceKey =
  | 'outdoors'
  | 'city'
  | 'culture'
  | 'beaches'
  | 'nature'
  | 'roadtrips'
  | 'food'
  | 'gym'
  | 'bar'
  | 'shopping'
  | 'skiing'
  | 'retreats'
  | 'spa';

export type PlaceMarker = {
  place_id: string;
  name: string;
  address: string | null;
  location: Coordinates;
  primary_type: string | null;
  rating: number | null;
};

type NearbyPlacesResponse = {
  center: Coordinates;
  radius_meters: number;
  places: PlaceMarker[];
  provider: 'google';
};

type ComputedRouteResponse = {
  distance_meters: number;
  duration_seconds: number;
  encoded_polyline: string;
  provider: 'google';
};

export type TripSummary = {
  id: string;
  owner_id: string;
  name: string;
  destination_name: string | null;
  member_count: number;
  current_user_role: 'owner' | 'admin' | 'member';
  status: 'planning' | 'active' | 'completed' | 'cancelled';
};

export type TravelGoal = {
  id: string;
  user_id: string;
  goal_text: string;
  created_at: string;
};

export type SavedTripPlace = {
  id: string;
  trip_id: string;
  place_id: string;
  google_place_id: string;
  name: string;
  address: string | null;
  location: Coordinates;
  primary_type: string | null;
  rating: number | null;
  suggested_by: string;
  vote_count: number;
  current_user_voted: boolean;
  google_data_refreshed_at: string;
  created_at: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object;
};

async function authenticatedRequest<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${data.session.access_token}`,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail ?? `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function searchNearbyPlaces(
  center: Coordinates,
  preferenceKeys: PreferenceKey[],
): Promise<NearbyPlacesResponse> {
  return authenticatedRequest('/api/v1/maps/places/nearby', {
    method: 'POST',
    body: {
      center,
      radius_meters: 5000,
      preference_keys: preferenceKeys,
      max_result_count: 10,
      rank_preference: 'POPULARITY',
    },
  });
}

export function computeRoute(
  origin: Coordinates,
  destination: Coordinates,
): Promise<ComputedRouteResponse> {
  return authenticatedRequest('/api/v1/maps/routes/compute', {
    method: 'POST',
    body: {
      origin,
      destination,
      travel_mode: 'DRIVE',
    },
  });
}

export function getTrips(): Promise<TripSummary[]> {
  return authenticatedRequest('/api/v1/trips');
}

export function createTrip(name: string): Promise<TripSummary> {
  return authenticatedRequest('/api/v1/trips', {
    method: 'POST',
    body: { name },
  });
}

export function deleteTrip(tripId: string): Promise<void> {
  return authenticatedRequest(`/api/v1/trips/${encodeURIComponent(tripId)}`, {
    method: 'DELETE',
  });
}

export function getTravelGoals(): Promise<TravelGoal[]> {
  return authenticatedRequest('/api/v1/me/goals');
}

export function createTravelGoal(goalText: string): Promise<TravelGoal> {
  return authenticatedRequest('/api/v1/me/goals', {
    method: 'POST',
    body: { goal_text: goalText },
  });
}

export function deleteTravelGoal(goalId: string): Promise<void> {
  return authenticatedRequest(
    `/api/v1/me/goals/${encodeURIComponent(goalId)}`,
    { method: 'DELETE' },
  );
}

export function getTripPlaces(tripId: string): Promise<SavedTripPlace[]> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/places`,
  );
}

export function savePlaceToTrip(
  tripId: string,
  place: PlaceMarker,
): Promise<SavedTripPlace> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/places`,
    {
      method: 'POST',
      body: {
        google_place_id: place.place_id,
        name: place.name,
        address: place.address,
        location: place.location,
        primary_type: place.primary_type,
        rating: place.rating,
      },
    },
  );
}

export function setTripPlaceVote(
  tripId: string,
  tripPlaceId: string,
  voted: boolean,
): Promise<SavedTripPlace> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/places/${encodeURIComponent(tripPlaceId)}/vote`,
    { method: voted ? 'PUT' : 'DELETE' },
  );
}
