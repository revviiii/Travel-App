import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { normalizePreferenceIds, PREFERENCE_CATEGORIES } from '@/constants/preferences';
import { usePreferences } from '@/contexts/PreferenceContext';
import { PlannerTab } from '@/components/home/PlannerTab';
import { EmptyState } from '@/components/home/EmptyState';
import { TravelGoalCard } from '@/components/home/TravelGoalCard';
import { TravelGoalInput } from '@/components/home/TravelGoalInput';
import { PreferenceFilterChip } from '@/components/discovery/PreferenceFilterChip';
import { PlaceCard } from '@/components/discovery/PlaceCard';
import { DiscoveryBottomSheet } from '@/components/discovery/DiscoveryBottomSheet';
import { DiscoveryFilterPanel } from '@/components/discovery/DiscoveryFilterPanel';
import {
  computeRoute,
  createGroupGoal,
  createTravelGoal,
  deleteGroupGoal,
  deleteTravelGoal,
  finalizeTripItinerary,
  getGroupGoals,
  getMyPreferences,
  getTravelGoals,
  getTripPlaces,
  getTrips,
  getPlacePhotoUrl,
  type PlaceMarker,
  type PreferenceKey,
  type SavedTripPlace,
  type TripSummary,
  savePlaceToTrip,
  searchNearbyPlaces,
  searchPlacesByText,
  setTripPlaceVote,
} from '@/lib/api';
import { decodeGooglePolyline } from '@/lib/polyline';
import { supabase } from '@/lib/supabase';

type DiscoverySection = 'preferences' | 'itinerary' | 'goals';

const MANILA_CENTER = {
  latitude: 14.5995,
  longitude: 120.9842,
};

type RouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
};

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

function formatScheduledDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatScheduledTime(value: string): string {
  return new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { destination, tripId, section } = useLocalSearchParams<{
    destination?: string;
    tripId?: string;
    section?: DiscoverySection;
  }>();
  const { selectedPreferences, setPreferences } = usePreferences();
  const isGroupMode = Boolean(tripId);
  const initialDestination = destination?.trim() || 'Manila';
  const [destinationInput, setDestinationInput] = useState(initialDestination);
  const [committedDestination, setCommittedDestination] = useState(initialDestination);
  const [mapCenter, setMapCenter] = useState(MANILA_CENTER);
  const [photoAccessToken, setPhotoAccessToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DiscoverySection>(
    section === 'itinerary' || section === 'goals' ? section : 'preferences',
  );
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilterOrder, setActiveFilterOrder] = useState<string[]>(() => {
    const initial = Array.from(selectedPreferences);
    return initial.length > 0 ? initial.slice(0, 4) : ['food', 'culture'];
  });
  const activeFilters = useMemo(() => new Set(activeFilterOrder), [activeFilterOrder]);
  const [places, setPlaces] = useState<PlaceMarker[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(tripId ?? null);
  const [savedPlaces, setSavedPlaces] = useState<SavedTripPlace[]>([]);
  const [isLoadingSavedPlaces, setIsLoadingSavedPlaces] = useState(false);
  const [isFinalizingItinerary, setIsFinalizingItinerary] = useState(false);
  const [placeToSave, setPlaceToSave] = useState<PlaceMarker | null>(null);
  const [choiceTripId, setChoiceTripId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [scheduledTime, setScheduledTime] = useState(() => {
    const initial = new Date();
    initial.setHours(9, 0, 0, 0);
    return initial;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const [calendarChoices, setCalendarChoices] = useState<Calendar.Calendar[]>([]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [goals, setGoals] = useState<{ id: string; goal_text: string }[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const filterQuery = activeFilterOrder.slice().sort().join(',');

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;

      void getMyPreferences()
        .then((preferences) => {
          if (isCurrent) setPreferences(normalizePreferenceIds(preferences));
        })
        .catch(() => undefined);

      return () => {
        isCurrent = false;
      };
    }, [setPreferences]),
  );

  useEffect(() => {
    const nextFilters = Array.from(selectedPreferences).slice(0, 4);
    setActiveFilterOrder((current) => {
      if (
        current.length === nextFilters.length
        && current.every((value, index) => value === nextFilters[index])
      ) {
        return current;
      }
      return nextFilters;
    });
  }, [selectedPreferences]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setPhotoAccessToken(data.session?.access_token ?? null);
    });
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function loadMapData() {
      setIsLoading(true);
      setErrorMessage(null);
      setRouteCoordinates([]);
      setRouteSummary(null);

      try {
        const preferenceKeys = normalizePreferenceIds(
          filterQuery.split(',').filter(Boolean),
        ) as PreferenceKey[];
        let center = MANILA_CENTER;
        const destinationResult = await searchPlacesByText(committedDestination);
        const destinationPlace = destinationResult.places[0];
        if (!destinationPlace) {
          throw new Error(`No destination matched “${committedDestination}”. Try a city or country.`);
        }
        center = destinationPlace.location;

        if (!isCurrent) {
          return;
        }

        setMapCenter(center);
        mapRef.current?.animateToRegion(
          { ...center, latitudeDelta: 0.18, longitudeDelta: 0.18 },
          600,
        );

        const nearby = await searchNearbyPlaces(center, preferenceKeys);

        if (!isCurrent) {
          return;
        }

        setPlaces(nearby.places);

        const firstPlace = nearby.places[0];
        if (firstPlace) {
          const route = await computeRoute(center, firstPlace.location);

          if (!isCurrent) {
            return;
          }

          setRouteCoordinates(decodeGooglePolyline(route.encoded_polyline));
          setRouteSummary({
            distanceMeters: route.distance_meters,
            durationSeconds: route.duration_seconds,
          });
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load Google Maps data.',
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadMapData();

    return () => {
      isCurrent = false;
    };
  }, [committedDestination, filterQuery, reloadToken]);

  const handleDestinationSubmit = useCallback(() => {
    const nextDestination = destinationInput.trim();
    if (nextDestination.length < 2) {
      Alert.alert('Enter a destination', 'Type a city, country, or landmark first.');
      return;
    }
    setCommittedDestination(nextDestination);
    setReloadToken((value) => value + 1);
  }, [destinationInput]);

  useEffect(() => {
    let isCurrent = true;

    async function loadTrips() {
      try {
        const availableTrips = await getTrips();
        if (!isCurrent) {
          return;
        }
        setTrips(availableTrips);
        setSelectedTripId((current) =>
          availableTrips.some((trip) => trip.id === current)
            ? current
            : availableTrips[0]?.id ?? null,
        );
      } catch (error) {
        if (isCurrent) {
          Alert.alert(
            'Unable to load groups',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      }
    }

    void loadTrips();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function loadSavedPlaces() {
      if (!selectedTripId) {
        setSavedPlaces([]);
        return;
      }

      setIsLoadingSavedPlaces(true);
      try {
        const saved = await getTripPlaces(selectedTripId);
        if (isCurrent) {
          setSavedPlaces(saved);
        }
      } catch (error) {
        if (isCurrent) {
          Alert.alert(
            'Unable to load saved places',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoadingSavedPlaces(false);
        }
      }
    }

    void loadSavedPlaces();
    return () => {
      isCurrent = false;
    };
  }, [selectedTripId]);

  useEffect(() => {
    if (!selectedTripId) return;

    let isCurrent = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const refreshSavedPlaces = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void getTripPlaces(selectedTripId)
          .then((saved) => {
            if (isCurrent) setSavedPlaces(saved);
          })
          .catch(() => undefined);
      }, 250);
    };
    const refreshGroupGoals = () => {
      if (!isGroupMode) return;
      void getGroupGoals(selectedTripId)
        .then((updatedGoals) => {
          if (isCurrent) setGoals(updatedGoals);
        })
        .catch(() => undefined);
    };

    const channel = supabase
      .channel(`trip-updates:${selectedTripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_places',
          filter: `trip_id=eq.${selectedTripId}`,
        },
        refreshSavedPlaces,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        refreshSavedPlaces,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_goals',
          filter: `trip_id=eq.${selectedTripId}`,
        },
        refreshGroupGoals,
      )
      .subscribe();

    return () => {
      isCurrent = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [isGroupMode, selectedTripId]);

  useEffect(() => {
    let isCurrent = true;

    async function loadGoals() {
      setIsLoadingGoals(true);
      setGoalError(null);
      try {
        const persistedGoals =
          isGroupMode && selectedTripId
            ? await getGroupGoals(selectedTripId)
            : await getTravelGoals();
        if (isCurrent) {
          setGoals(persistedGoals);
        }
      } catch (error) {
        if (isCurrent) {
          setGoalError(error instanceof Error ? error.message : 'Unable to load goals.');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingGoals(false);
        }
      }
    }

    void loadGoals();
    return () => {
      isCurrent = false;
    };
  }, [isGroupMode, selectedTripId]);

  const toggleFilter = (id: string) => {
    setActiveFilterOrder((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else if (prev.length < 4) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const openSavePicker = (place: PlaceMarker) => {
    if (trips.length === 0) {
      Alert.alert('Create a group first', 'Add a group on the Home screen before saving places.');
      return;
    }
    setChoiceTripId(selectedTripId ?? trips[0].id);
    setVotingEnabled(true);
    setPlaceToSave(place);
  };

  const openGoogleMapsPlace = async (place: PlaceMarker) => {
    const query = `${place.location.latitude},${place.location.longitude}`;
    const googleMapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      + `&query_place_id=${encodeURIComponent(place.place_id)}`;

    try {
      await Linking.openURL(googleMapsUrl);
    } catch {
      Alert.alert('Unable to open Google Maps', 'Please try again from your browser.');
    }
  };

  const handleSavePlace = async () => {
    if (!placeToSave || !choiceTripId) {
      return;
    }

    const choiceTrip = trips.find((trip) => trip.id === choiceTripId);
    const canManageVoting =
      choiceTrip?.current_user_role === 'owner' || choiceTrip?.current_user_role === 'admin';
    setIsSavingPlace(true);
    try {
      await savePlaceToTrip(choiceTripId, placeToSave, {
        scheduledDate: toDateValue(scheduledDate),
        scheduledTime: toTimeValue(scheduledTime),
        durationMinutes: 120,
        votingEnabled: canManageVoting ? votingEnabled : true,
      });
      setSelectedTripId(choiceTripId);
      setSavedPlaces(await getTripPlaces(choiceTripId));
      setPlaceToSave(null);
      setActiveTab('itinerary');
      Alert.alert(
        'Added to itinerary',
        `${placeToSave.name} was scheduled for ${formatScheduledDate(toDateValue(scheduledDate))} at ${formatScheduledTime(toTimeValue(scheduledTime))}.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to save place',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingPlace(false);
    }
  };

  const handleToggleVote = async (place: SavedTripPlace) => {
    if (!selectedTripId) {
      return;
    }

    try {
      const updated = await setTripPlaceVote(
        selectedTripId,
        place.id,
        !place.current_user_voted,
      );
      setSavedPlaces((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      Alert.alert(
        'Unable to update vote',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleFinalizeItinerary = async () => {
    if (!selectedTripId) {
      return;
    }

    setIsFinalizingItinerary(true);
    try {
      await finalizeTripItinerary(selectedTripId);
      setSavedPlaces(await getTripPlaces(selectedTripId));
      Alert.alert(
        'Itinerary finalized',
        'All scheduled places are now confirmed and available for calendar sync.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to finalize itinerary',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsFinalizingItinerary(false);
    }
  };

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const choiceTrip = trips.find((trip) => trip.id === choiceTripId);
  const canChoiceTripManageVoting =
    choiceTrip?.current_user_role === 'owner' || choiceTrip?.current_user_role === 'admin';
  const scheduledPlaces = useMemo(
    () =>
      [...savedPlaces].sort((left, right) =>
        `${left.scheduled_date}T${left.scheduled_time}`.localeCompare(
          `${right.scheduled_date}T${right.scheduled_time}`,
        ),
      ),
    [savedPlaces],
  );
  const confirmedPlaces = useMemo(
    () => scheduledPlaces.filter((place) => place.is_confirmed),
    [scheduledPlaces],
  );

  const handleDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowDatePicker(false);
    if (value) {
      setScheduledDate(value);
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowTimePicker(false);
    if (value) {
      setScheduledTime(value);
    }
  };

  const handleOpenCalendarPicker = async () => {
    if (confirmedPlaces.length === 0) {
      Alert.alert(
        'Nothing ready to sync',
        'Only orange places confirmed by all voters or finalized by the group leader can be synced.',
      );
      return;
    }

    try {
      if (!(await Calendar.isAvailableAsync())) {
        throw new Error('A system calendar is not available on this device.');
      }
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Calendar permission is required to sync the itinerary.');
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writableCalendars = calendars.filter((calendar) => calendar.allowsModifications);
      if (writableCalendars.length === 0) {
        if (Platform.OS === 'android') {
          const localCalendarId = await Calendar.createCalendarAsync({
            title: 'Pinara Itineraries',
            name: 'pinaraItineraries',
            color: AutumnColors.primary,
            entityType: Calendar.EntityTypes.EVENT,
            source: { isLocalAccount: true, name: 'Pinara' } as Calendar.Source,
            ownerAccount: 'Pinara',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });
          await handleSyncToCalendar(localCalendarId);
          return;
        }
        throw new Error('Add a writable device or iCloud calendar, then try again.');
      }
      setCalendarChoices(writableCalendars);
      setShowCalendarPicker(true);
    } catch (error) {
      Alert.alert(
        'Unable to open calendars',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleSyncToCalendar = async (calendarId: string) => {
    setShowCalendarPicker(false);
    setIsSyncingCalendar(true);
    try {
      for (const place of confirmedPlaces) {
        const startDate = new Date(`${place.scheduled_date}T${place.scheduled_time}`);
        const endDate = new Date(
          startDate.getTime() + place.duration_minutes * 60 * 1000,
        );
        await Calendar.createEventAsync(calendarId, {
          title: place.name,
          startDate,
          endDate,
          location: place.address ?? undefined,
          notes: `${selectedTrip?.name ?? 'Pinara'} finalized itinerary`,
        });
      }
      Alert.alert(
        'Calendar synced',
        `${confirmedPlaces.length} confirmed ${confirmedPlaces.length === 1 ? 'place was' : 'places were'} added.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to sync calendar',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Ordered category list: active filters first (in selection order), then inactive in original order
  const orderedCategories = useMemo(() => {
    const activeSet = new Set(activeFilterOrder);
    const active = activeFilterOrder
      .map((id) => PREFERENCE_CATEGORIES.find((c) => c.id === id))
      .filter(Boolean) as typeof PREFERENCE_CATEGORIES;
    const inactive = PREFERENCE_CATEGORIES.filter((c) => !activeSet.has(c.id));
    return [...active, ...inactive];
  }, [activeFilterOrder]);

  // Filter panel handlers
  const handleOpenFilterPanel = useCallback(() => {
    setShowFilterPanel(true);
  }, []);

  const handleApplyFilters = useCallback((filters: Set<string>) => {
    setActiveFilterOrder(Array.from(filters));
    setShowFilterPanel(false);
  }, []);

  const handleCancelFilterPanel = useCallback(() => {
    setShowFilterPanel(false);
  }, []);

  const handleAddGoal = useCallback(async (text: string) => {
    try {
      const goal =
        isGroupMode && selectedTripId
          ? await createGroupGoal(selectedTripId, text)
          : await createTravelGoal(text);
      setGoals((current) => [goal, ...current]);
    } catch (error) {
      Alert.alert(
        'Unable to add goal',
        error instanceof Error ? error.message : 'Please try again.',
      );
      throw error;
    }
  }, [isGroupMode, selectedTripId]);

  const handleLongPressGoal = useCallback((id: string) => {
    setGoalToDelete(id);
  }, []);

  const handleConfirmDeleteGoal = useCallback(async () => {
    if (goalToDelete !== null) {
      try {
        if (isGroupMode && selectedTripId) {
          await deleteGroupGoal(selectedTripId, goalToDelete);
        } else {
          await deleteTravelGoal(goalToDelete);
        }
        setGoals((current) => current.filter((goal) => goal.id !== goalToDelete));
        setGoalToDelete(null);
      } catch (error) {
        Alert.alert(
          'Unable to delete goal',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    }
  }, [goalToDelete, isGroupMode, selectedTripId]);

  const handleCancelDeleteGoal = useCallback(() => {
    setGoalToDelete(null);
  }, []);

  const renderGoalItem = useCallback(
    ({ item }: { item: { id: string; goal_text: string } }) => (
      <TravelGoalCard text={item.goal_text} onLongPress={() => handleLongPressGoal(item.id)} />
    ),
    [handleLongPressGoal],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          initialRegion={{
            ...mapCenter,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
          style={StyleSheet.absoluteFillObject}
        >
          <Marker
            coordinate={mapCenter}
            pinColor={AutumnColors.primary}
            title={committedDestination}
          />
          {places.map((place) => (
            <Marker
              coordinate={place.location}
              description={place.address ?? undefined}
              key={place.place_id}
              title={place.name}
            />
          ))}
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={AutumnColors.primary}
              strokeWidth={5}
            />
          )}
        </MapView>

        <View style={[styles.mapOverlay, { top: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.searchPill}>
            <TextInput
              style={styles.searchInput}
              value={destinationInput}
              onChangeText={setDestinationInput}
              onSubmitEditing={handleDestinationSubmit}
              returnKeyType="search"
              selectTextOnFocus
              accessibilityLabel="Destination"
            />
            <TouchableOpacity
              accessibilityLabel="Search destination"
              accessibilityRole="button"
              onPress={handleDestinationSubmit}
              style={styles.destinationSearchButton}
            >
              <Ionicons color={AutumnColors.primary} name="search" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && (
          <View style={styles.mapStatus}>
            <ActivityIndicator color={AutumnColors.primary} />
            <Text style={styles.mapStatusText}>Loading live places and route…</Text>
          </View>
        )}

        {!isLoading && errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setReloadToken((value) => value + 1)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && routeSummary && (
          <View style={styles.routeBadge}>
            <Text style={styles.routeBadgeText}>
              {(routeSummary.distanceMeters / 1000).toFixed(1)} km ·{' '}
              {Math.ceil(routeSummary.durationSeconds / 60)} min
            </Text>
          </View>
        )}
      </View>

      {/* Draggable bottom sheet */}
      <DiscoveryBottomSheet>
        {/* Discovery navigation tabs */}
        <View style={styles.tabRow}>
          <PlannerTab
            label="Preferences"
            active={activeTab === 'preferences'}
            onPress={() => setActiveTab('preferences')}
          />
          <PlannerTab
            label="Itinerary"
            active={activeTab === 'itinerary'}
            onPress={() => setActiveTab('itinerary')}
          />
          <PlannerTab
            label="Goals"
            active={activeTab === 'goals'}
            onPress={() => setActiveTab('goals')}
          />
        </View>

        {activeTab === 'preferences' && (
          <View style={styles.preferencesContent}>
            {/* Filter row — button + all category chips (horizontally scrollable) */}
            <View style={styles.filterRow}>
              {/* Filter button */}
              <TouchableOpacity
                onPress={handleOpenFilterPanel}
                accessibilityRole="button"
                accessibilityLabel="Open filter selection"
                style={styles.filterButton}
              >
                <Ionicons color={AutumnColors.primary} name="options-outline" size={19} />
              </TouchableOpacity>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChips}
                nestedScrollEnabled
              >
                {orderedCategories.map((cat) => (
                  <PreferenceFilterChip
                    key={cat.id}
                    label={cat.label}
                    active={activeFilters.has(cat.id)}
                    onPress={() => toggleFilter(cat.id)}
                  />
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={places}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <PlaceCard
                  category={formatPlaceType(item.primary_type)}
                  name={item.name}
                  location={item.address ?? 'Address unavailable'}
                  rating={item.rating}
                  status="Live Google result"
                  photoUri={item.photo_name ? getPlacePhotoUrl(item.photo_name) : undefined}
                  photoHeaders={
                    photoAccessToken
                      ? { Authorization: `Bearer ${photoAccessToken}` }
                      : undefined
                  }
                  actionLabel={`Save ${item.name} to a group`}
                  onActionPress={() => openSavePicker(item)}
                  onDetailsPress={() => void openGoogleMapsPlace(item)}
                />
              )}
              contentContainerStyle={styles.placeList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              ItemSeparatorComponent={() => <View style={styles.placeSeparator} />}
              ListEmptyComponent={
                !isLoading ? (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptyTitle}>No matches</Text>
                    <Text style={styles.emptyDescription}>
                      Try adjusting your filters to see more places.
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        )}

        {activeTab === 'itinerary' && (
          <View style={styles.savedPlacesContent}>
            {trips.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tripChips}
              >
                {trips.map((trip) => (
                  <PreferenceFilterChip
                    key={trip.id}
                    label={trip.name}
                    active={trip.id === selectedTripId}
                    onPress={() => setSelectedTripId(trip.id)}
                  />
                ))}
              </ScrollView>
            )}

            {isLoadingSavedPlaces ? (
              <View style={styles.emptySection}>
                <ActivityIndicator color={AutumnColors.primary} />
                <Text style={styles.emptyDescription}>Loading saved places...</Text>
              </View>
            ) : savedPlaces.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptyTitle}>No saved places yet!</Text>
                <Text style={styles.emptyDescription}>
                  Save a recommendation, then vote on it with your group.
                </Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.itineraryContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={styles.timelineLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.confirmedBackground]} />
                    <Text style={styles.legendText}>Confirmed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.pendingBackground]} />
                    <Text style={styles.legendText}>Waiting for decision</Text>
                  </View>
                </View>

                {(selectedTrip?.current_user_role === 'owner' ||
                  selectedTrip?.current_user_role === 'admin') &&
                !scheduledPlaces.every((place) => place.is_confirmed) ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Finalize all scheduled places"
                    disabled={isFinalizingItinerary}
                    onPress={() => void handleFinalizeItinerary()}
                    style={[
                      styles.finalizeButton,
                      isFinalizingItinerary && styles.actionButtonDisabled,
                    ]}
                  >
                    {isFinalizingItinerary ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.finalizeButtonText}>
                        Finalize all scheduled places
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : selectedTrip?.current_user_role === 'member' ? (
                  <Text style={styles.itineraryHelperText}>
                    Places turn orange after every member votes, or when the group leader
                    finalizes the schedule.
                  </Text>
                ) : null}

                <View style={styles.timeline}>
                  {scheduledPlaces.map((item, index) => (
                    <View key={item.id} style={styles.timelineRow}>
                      <View style={styles.timelineTimeColumn}>
                        <Text style={styles.timelineDate}>
                          {formatScheduledDate(item.scheduled_date)}
                        </Text>
                        <Text style={styles.timelineTime}>
                          {formatScheduledTime(item.scheduled_time)}
                        </Text>
                      </View>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineDot,
                            item.is_confirmed
                              ? styles.confirmedBackground
                              : styles.pendingBackground,
                          ]}
                        />
                        {index < scheduledPlaces.length - 1 && (
                          <View
                            style={[
                              styles.timelineLine,
                              item.is_confirmed
                                ? styles.confirmedBackground
                                : styles.pendingBackground,
                            ]}
                          />
                        )}
                      </View>
                      <View
                        style={[
                          styles.timelineCard,
                          item.is_confirmed
                            ? styles.confirmedCard
                            : styles.pendingCard,
                        ]}
                      >
                        <View style={styles.timelineCardRow}>
                          {item.photo_name ? (
                            <Image
                              contentFit="cover"
                              source={{
                                uri: getPlacePhotoUrl(item.photo_name, 320),
                                headers: photoAccessToken
                                  ? { Authorization: `Bearer ${photoAccessToken}` }
                                  : undefined,
                              }}
                              style={styles.timelineImage}
                            />
                          ) : (
                            <View style={styles.timelineImagePlaceholder}>
                              <Ionicons color={AutumnColors.body} name="image-outline" size={22} />
                            </View>
                          )}
                          <View style={styles.timelineCardCopy}>
                            <Text style={styles.timelinePlaceName}>{item.name}</Text>
                            <Text style={styles.timelinePlaceType}>
                              {formatPlaceType(item.primary_type)} · {item.duration_minutes} min
                            </Text>
                            <Text style={styles.timelineVoteStatus}>
                              {item.is_confirmed
                                ? 'Confirmed · ready for calendar'
                                : `${item.vote_count}/${item.required_vote_count} group votes`}
                            </Text>
                          </View>
                        </View>
                        {item.voting_enabled ? (
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={
                              item.current_user_voted ? 'Remove vote' : 'Vote for place'
                            }
                            onPress={() => void handleToggleVote(item)}
                            style={styles.voteButton}
                          >
                            <Text style={styles.voteButtonText}>
                              {item.current_user_voted ? 'Remove vote' : 'Vote for place'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.leaderDecisionText}>Leader decision</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Sync confirmed places to calendar"
                  disabled={confirmedPlaces.length === 0 || isSyncingCalendar}
                  onPress={() => void handleOpenCalendarPicker()}
                  style={[
                    styles.calendarButton,
                    (confirmedPlaces.length === 0 || isSyncingCalendar) &&
                      styles.calendarButtonDisabled,
                  ]}
                >
                  {isSyncingCalendar ? (
                    <ActivityIndicator color={AutumnColors.heading} />
                  ) : (
                    <Text style={styles.calendarButtonText}>
                      Sync {confirmedPlaces.length} confirmed{' '}
                      {confirmedPlaces.length === 1 ? 'place' : 'places'} to calendar
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        )}

        {activeTab === 'goals' && (
          <View style={styles.goalsContainer}>
            <TravelGoalInput onAdd={handleAddGoal} />

            {isLoadingGoals ? (
              <View style={styles.emptySection}>
                <ActivityIndicator color={AutumnColors.primary} />
                <Text style={styles.emptyDescription}>Loading goals...</Text>
              </View>
            ) : goalError ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptyDescription}>{goalError}</Text>
              </View>
            ) : goals.length === 0 ? (
              <EmptyState
                title={isGroupMode ? 'No group goals yet!' : 'No travel goals yet!'}
                description={
                  isGroupMode
                    ? 'Add a shared challenge for this group.'
                    : 'Add a goal for your next adventure.'
                }
              />
            ) : (
              <FlatList
                data={goals}
                keyExtractor={(item) => item.id}
                renderItem={renderGoalItem}
                contentContainerStyle={styles.goalsList}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                ItemSeparatorComponent={() => <View style={styles.goalSeparator} />}
              />
            )}
          </View>
        )}
      </DiscoveryBottomSheet>

      <DiscoveryFilterPanel
        visible={showFilterPanel}
        currentFilters={activeFilters}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilterPanel}
      />

      <Modal
        visible={placeToSave !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaceToSave(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Preferences – Choices</Text>
            <Text style={styles.modalDescription} numberOfLines={2}>
              {placeToSave?.name}
            </Text>
            <Text style={styles.choiceLabel}>Add to group</Text>
            <View style={styles.modalTripList}>
              {trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  disabled={isSavingPlace}
                  onPress={() => {
                    setChoiceTripId(trip.id);
                    setVotingEnabled(true);
                  }}
                  style={[
                    styles.modalTripButton,
                    trip.id === choiceTripId && styles.modalTripButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTripText,
                      trip.id === choiceTripId && styles.modalTripTextSelected,
                    ]}
                  >
                    {trip.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.choicePanel}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Select itinerary date"
                onPress={() => setShowDatePicker(true)}
                style={styles.choiceRow}
              >
                <Text style={styles.choiceRowIcon}>▣</Text>
                <View style={styles.choiceRowContent}>
                  <Text style={styles.choiceRowLabel}>Select Date</Text>
                  <Text style={styles.choiceRowValue}>
                    {formatScheduledDate(toDateValue(scheduledDate))}
                  </Text>
                </View>
                <Text style={styles.choiceChevron}>⌄</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Select itinerary time"
                onPress={() => setShowTimePicker(true)}
                style={styles.choiceRow}
              >
                <Text style={styles.choiceRowIcon}>◷</Text>
                <View style={styles.choiceRowContent}>
                  <Text style={styles.choiceRowLabel}>Select Time</Text>
                  <Text style={styles.choiceRowValue}>
                    {formatScheduledTime(toTimeValue(scheduledTime))}
                  </Text>
                </View>
                <Text style={styles.choiceChevron}>⌄</Text>
              </TouchableOpacity>

              {canChoiceTripManageVoting ? (
                <View style={styles.votingRow}>
                  <View style={styles.votingCopy}>
                    <Text style={styles.votingTitle}>Group Voting</Text>
                    <Text style={styles.votingDescription}>
                      Let group members vote on this destination.
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Enable group voting"
                    value={votingEnabled}
                    onValueChange={setVotingEnabled}
                    trackColor={{ false: '#C8C8C8', true: AutumnColors.secondaryAccent }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ) : (
                <Text style={styles.memberVotingNote}>
                  Group voting is enabled. Only the group leader can change this option.
                </Text>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                onChange={handleTimeChange}
              />
            )}
            <TouchableOpacity
              disabled={isSavingPlace || choiceTripId === null}
              onPress={() => void handleSavePlace()}
              style={[
                styles.modalAddButton,
                (isSavingPlace || choiceTripId === null) && styles.actionButtonDisabled,
              ]}
            >
              {isSavingPlace ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalAddButtonText}>Add to Itinerary</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isSavingPlace}
              onPress={() => setPlaceToSave(null)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>
                {isSavingPlace ? 'Saving...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCalendarPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose a calendar</Text>
            <Text style={styles.modalDescription}>
              Only the {confirmedPlaces.length} orange confirmed{' '}
              {confirmedPlaces.length === 1 ? 'place' : 'places'} will be added.
            </Text>
            <View style={styles.calendarChoices}>
              {calendarChoices.map((calendar) => (
                <TouchableOpacity
                  key={calendar.id}
                  onPress={() => void handleSyncToCalendar(calendar.id)}
                  style={styles.calendarChoice}
                >
                  <View
                    style={[styles.calendarColor, { backgroundColor: calendar.color }]}
                  />
                  <View style={styles.calendarChoiceCopy}>
                    <Text style={styles.calendarChoiceTitle}>{calendar.title}</Text>
                    <Text style={styles.calendarChoiceSource}>
                      {calendar.source?.name ?? 'Device calendar'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowCalendarPicker(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={goalToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDeleteGoal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Clear this goal?</Text>
            <Text style={styles.modalDescription}>
              This will remove the selected travel goal.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleCancelDeleteGoal}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDeleteGoal}
                accessibilityRole="button"
                accessibilityLabel="Clear Goal"
                style={styles.modalClearButton}
              >
                <Text style={styles.modalClearText}>Clear Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatPlaceType(value: string | null) {
  if (!value) {
    return 'Place';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.heading,
  },
  mapArea: {
    flex: 1,
    minHeight: '45%',
    backgroundColor: '#EDE9E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: AutumnColors.heading,
    fontSize: 30,
    lineHeight: 32,
  },
  searchPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: AutumnColors.chipText,
    padding: 0,
  },
  destinationSearchButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  mapStatus: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapStatusText: {
    color: AutumnColors.heading,
    fontSize: 12,
    fontWeight: '600',
  },
  errorCard: {
    marginHorizontal: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: '#A52235',
    fontSize: 12,
    textAlign: 'center',
  },
  retryText: {
    color: AutumnColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  routeBadge: {
    position: 'absolute',
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: AutumnColors.primary,
  },
  routeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  preferencesContent: {
    flex: 1,
  },
  savedPlacesContent: {
    flex: 1,
  },
  tripChips: {
    gap: 8,
    paddingBottom: 12,
  },
  itineraryContent: {
    paddingBottom: 16,
  },
  finalizeButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itineraryHelperText: {
    color: AutumnColors.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    color: AutumnColors.body,
    fontSize: 11,
  },
  confirmedBackground: {
    backgroundColor: AutumnColors.autumnAccent,
  },
  pendingBackground: {
    backgroundColor: '#8D9488',
  },
  timeline: {
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 112,
  },
  timelineTimeColumn: {
    width: 74,
    paddingTop: 14,
    paddingRight: 6,
  },
  timelineDate: {
    color: AutumnColors.body,
    fontSize: 10,
    lineHeight: 14,
  },
  timelineTime: {
    color: AutumnColors.heading,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  timelineRail: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginBottom: -1,
  },
  timelineCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  timelineCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineImage: {
    width: 54,
    height: 54,
    borderRadius: 9,
    backgroundColor: AutumnColors.chipBackground,
  },
  timelineImagePlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 9,
    backgroundColor: AutumnColors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCardCopy: {
    flex: 1,
  },
  confirmedCard: {
    borderColor: AutumnColors.autumnAccent,
    backgroundColor: '#FFF7ED',
  },
  pendingCard: {
    borderColor: '#B9BDB6',
    backgroundColor: '#F4F2ED',
  },
  timelinePlaceName: {
    color: AutumnColors.heading,
    fontSize: 14,
    fontWeight: '700',
  },
  timelinePlaceType: {
    color: AutumnColors.body,
    fontSize: 11,
    marginTop: 2,
  },
  timelineVoteStatus: {
    color: AutumnColors.body,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  voteButton: {
    alignSelf: 'flex-end',
    borderRadius: 14,
    backgroundColor: AutumnColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 7,
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  leaderDecisionText: {
    alignSelf: 'flex-end',
    color: AutumnColors.autumnAccent,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 7,
  },
  calendarButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  calendarButtonDisabled: {
    opacity: 0.5,
  },
  calendarButtonText: {
    color: AutumnColors.heading,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  planSection: {
    marginBottom: 18,
  },
  planTitle: {
    color: AutumnColors.heading,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  planSummary: {
    color: AutumnColors.body,
    fontSize: 13,
    lineHeight: 19,
  },
  planDates: {
    color: AutumnColors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 14,
  },
  itineraryDay: {
    marginBottom: 14,
  },
  itineraryDayTitle: {
    color: AutumnColors.heading,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  itineraryItem: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    backgroundColor: AutumnColors.chipBackground,
    padding: 12,
    marginBottom: 8,
  },
  itineraryTimeColumn: {
    width: 66,
    paddingRight: 10,
  },
  itineraryTime: {
    color: AutumnColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  itineraryDuration: {
    color: AutumnColors.body,
    fontSize: 11,
    marginTop: 3,
  },
  itineraryPlaceColumn: {
    flex: 1,
  },
  itineraryPlaceName: {
    color: AutumnColors.heading,
    fontSize: 14,
    fontWeight: '700',
  },
  itineraryPlaceAddress: {
    color: AutumnColors.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  itineraryTravelTime: {
    color: AutumnColors.autumnAccent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  itineraryNotes: {
    color: AutumnColors.body,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 5,
  },
  savedPlacesTitle: {
    color: AutumnColors.heading,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  savedPlaceItem: {
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChips: {
    gap: 10,
    paddingRight: 8,
  },
  placeList: {
    paddingBottom: 4,
  },
  placeSeparator: {
    height: 10,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'center',
    lineHeight: 18,
    paddingVertical: 12,
  },
  modalTripList: {
    gap: 10,
    marginBottom: 14,
  },
  modalTripButton: {
    borderRadius: 12,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalTripButtonSelected: {
    backgroundColor: AutumnColors.secondaryAccent,
    borderColor: AutumnColors.secondaryAccent,
  },
  modalTripText: {
    color: AutumnColors.chipText,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalTripTextSelected: {
    color: '#FFFFFF',
  },
  choiceLabel: {
    color: AutumnColors.heading,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  choicePanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    backgroundColor: AutumnColors.chipBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  choiceRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AutumnColors.chipBorder,
  },
  choiceRowIcon: {
    width: 24,
    color: AutumnColors.heading,
    fontSize: 16,
  },
  choiceRowContent: {
    flex: 1,
  },
  choiceRowLabel: {
    color: AutumnColors.body,
    fontSize: 10,
  },
  choiceRowValue: {
    color: AutumnColors.heading,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  choiceChevron: {
    color: AutumnColors.heading,
    fontSize: 18,
  },
  votingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  votingCopy: {
    flex: 1,
    paddingRight: 10,
  },
  votingTitle: {
    color: AutumnColors.heading,
    fontSize: 12,
    fontWeight: '700',
  },
  votingDescription: {
    color: AutumnColors.body,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  memberVotingNote: {
    color: AutumnColors.body,
    fontSize: 10,
    lineHeight: 14,
    paddingTop: 10,
  },
  modalAddButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  calendarChoices: {
    gap: 8,
    marginBottom: 14,
  },
  calendarChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    padding: 12,
  },
  calendarColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  calendarChoiceCopy: {
    flex: 1,
  },
  calendarChoiceTitle: {
    color: AutumnColors.heading,
    fontSize: 13,
    fontWeight: '700',
  },
  calendarChoiceSource: {
    color: AutumnColors.body,
    fontSize: 11,
    marginTop: 2,
  },
  /* Goals */
  goalsContainer: {
    flexShrink: 1,
  },
  goalsList: {
    paddingBottom: 16,
  },
  goalSeparator: {
    height: 10,
  },

  /* Modal — Clear Goal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: AutumnColors.background,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AutumnColors.heading,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: AutumnColors.body,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  modalClearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AutumnColors.primary,
  },
  modalClearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
