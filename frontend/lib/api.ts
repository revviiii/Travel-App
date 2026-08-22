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
  photo_name: string | null;
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
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  member_count: number;
  current_user_role: 'owner' | 'admin' | 'member';
  status: 'planning' | 'active' | 'completed' | 'cancelled';
};

export type TripMember = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  full_name: string | null;
  avatar_url: string | null;
  preference_keys: string[];
};

export type TripInvitation = {
  id: string;
  trip_id: string;
  created_by: string;
  invite_token: string;
  expires_at: string | null;
  maximum_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  phone_number: string | null;
  gender: string | null;
  preferred_language: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type UserProfileUpdate = Partial<
  Pick<
    UserProfile,
    | 'full_name'
    | 'avatar_url'
    | 'country'
    | 'phone_number'
    | 'gender'
    | 'preferred_language'
    | 'onboarding_completed'
  >
>;

export type TravelGoal = {
  id: string;
  user_id: string;
  goal_text: string;
  created_at: string;
};

export type GroupGoal = {
  id: string;
  trip_id: string;
  created_by: string;
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
  photo_name: string | null;
  suggested_by: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  voting_enabled: boolean;
  leader_finalized_at: string | null;
  leader_finalized_by: string | null;
  vote_count: number;
  required_vote_count: number;
  current_user_voted: boolean;
  is_confirmed: boolean;
  google_data_refreshed_at: string;
  created_at: string;
};

export type ItineraryItem = {
  id: string;
  trip_place_id: string;
  day_number: number;
  position: number;
  start_time: string;
  duration_minutes: number;
  travel_time_from_previous_minutes: number;
  notes: string;
  place: SavedTripPlace;
  created_at: string;
};

export type TripItinerary = {
  id: string;
  trip_id: string;
  created_by: string;
  title: string;
  summary: string;
  generation_method: string;
  start_date: string;
  end_date: string;
  items: ItineraryItem[];
  created_at: string;
  updated_at: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

export function searchPlacesByText(query: string): Promise<{ places: PlaceMarker[] }> {
  return authenticatedRequest('/api/v1/maps/places/search', {
    method: 'POST',
    body: {
      query,
      max_result_count: 5,
    },
  });
}

export function getPlacePhotoUrl(photoName: string, maxWidthPx = 480): string {
  const query = new URLSearchParams({
    photo_name: photoName,
    max_width_px: String(maxWidthPx),
  });
  return `${apiUrl}/api/v1/maps/places/photo?${query.toString()}`;
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

export function getMyProfile(): Promise<UserProfile> {
  return authenticatedRequest('/api/v1/me');
}

export function updateMyProfile(update: UserProfileUpdate): Promise<UserProfile> {
  return authenticatedRequest('/api/v1/me', {
    method: 'PATCH',
    body: update,
  });
}

export async function getMyPreferences(): Promise<string[]> {
  const response = await authenticatedRequest<{ preference_keys: string[] }>(
    '/api/v1/me/preferences',
  );
  return response.preference_keys;
}

export async function replaceMyPreferences(preferenceKeys: string[]): Promise<string[]> {
  const response = await authenticatedRequest<{ preference_keys: string[] }>(
    '/api/v1/me/preferences',
    {
      method: 'PUT',
      body: { preference_keys: preferenceKeys },
    },
  );
  return response.preference_keys;
}

export function getTrip(tripId: string): Promise<TripSummary> {
  return authenticatedRequest(`/api/v1/trips/${encodeURIComponent(tripId)}`);
}

export function getTripMembers(tripId: string): Promise<TripMember[]> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/members`,
  );
}

export function createTripInvitation(
  tripId: string,
  maximumUses = 10,
): Promise<TripInvitation> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/invitations`,
    {
      method: 'POST',
      body: {
        expires_at: expiresAt.toISOString(),
        maximum_uses: maximumUses,
      },
    },
  );
}

export function acceptTripInvitation(inviteToken: string): Promise<TripSummary> {
  return authenticatedRequest(
    `/api/v1/invitations/${encodeURIComponent(inviteToken)}/accept`,
    { method: 'POST' },
  );
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

export function getGroupGoals(tripId: string): Promise<GroupGoal[]> {
  return authenticatedRequest(`/api/v1/trips/${encodeURIComponent(tripId)}/goals`);
}

export function createGroupGoal(tripId: string, goalText: string): Promise<GroupGoal> {
  return authenticatedRequest(`/api/v1/trips/${encodeURIComponent(tripId)}/goals`, {
    method: 'POST',
    body: { goal_text: goalText },
  });
}

export function deleteGroupGoal(tripId: string, goalId: string): Promise<void> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/goals/${encodeURIComponent(goalId)}`,
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
  schedule: {
    scheduledDate: string;
    scheduledTime: string;
    durationMinutes?: number;
    votingEnabled: boolean;
  },
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
        photo_name: place.photo_name,
        scheduled_date: schedule.scheduledDate,
        scheduled_time: schedule.scheduledTime,
        duration_minutes: schedule.durationMinutes ?? 120,
        voting_enabled: schedule.votingEnabled,
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

export function getTripItinerary(tripId: string): Promise<TripItinerary | null> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/itinerary`,
  );
}

export function finalizeTripItinerary(tripId: string): Promise<TripItinerary> {
  return authenticatedRequest(
    `/api/v1/trips/${encodeURIComponent(tripId)}/itinerary/finalize`,
    { method: 'POST' },
  );
}
