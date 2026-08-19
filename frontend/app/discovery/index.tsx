import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PlannerTab } from '@/components/home/PlannerTab';
import { PreferenceFilterChip } from '@/components/discovery/PreferenceFilterChip';
import { PlaceCard } from '@/components/discovery/PlaceCard';
import {
  computeRoute,
  getTripPlaces,
  getTrips,
  type PlaceMarker,
  type PreferenceKey,
  type SavedTripPlace,
  type TripSummary,
  savePlaceToTrip,
  searchNearbyPlaces,
  setTripPlaceVote,
} from '@/lib/api';
import { decodeGooglePolyline } from '@/lib/polyline';

type DiscoverySection = 'preferences' | 'itinerary' | 'goals';

const MANILA_CENTER = {
  latitude: 14.5995,
  longitude: 120.9842,
};

const FILTERS: { id: PreferenceKey; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'culture', label: 'Culture' },
  { id: 'nature', label: 'Nature' },
];

type RouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
};

export default function DiscoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { destination } = useLocalSearchParams<{ destination?: string }>();

  const [activeTab, setActiveTab] = useState<DiscoverySection>('preferences');
  const [activeFilters, setActiveFilters] = useState<Set<PreferenceKey>>(
    new Set(['food', 'culture']),
  );
  const [places, setPlaces] = useState<PlaceMarker[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedTripPlace[]>([]);
  const [isLoadingSavedPlaces, setIsLoadingSavedPlaces] = useState(false);
  const [placeToSave, setPlaceToSave] = useState<PlaceMarker | null>(null);
  const [isSavingPlace, setIsSavingPlace] = useState(false);

  const filterQuery = Array.from(activeFilters).sort().join(',');

  useEffect(() => {
    let isCurrent = true;

    async function loadMapData() {
      setIsLoading(true);
      setErrorMessage(null);
      setRouteCoordinates([]);
      setRouteSummary(null);

      try {
        const selectedPreferences = filterQuery
          .split(',')
          .filter(Boolean) as PreferenceKey[];
        const nearby = await searchNearbyPlaces(MANILA_CENTER, selectedPreferences);

        if (!isCurrent) {
          return;
        }

        setPlaces(nearby.places);

        const firstPlace = nearby.places[0];
        if (firstPlace) {
          const route = await computeRoute(MANILA_CENTER, firstPlace.location);

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
  }, [filterQuery, reloadToken]);

  useEffect(() => {
    let isCurrent = true;

    async function loadTrips() {
      try {
        const availableTrips = await getTrips();
        if (!isCurrent) {
          return;
        }
        setTrips(availableTrips);
        setSelectedTripId((current) => current ?? availableTrips[0]?.id ?? null);
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

  const toggleFilter = (id: PreferenceKey) => {
    setActiveFilters((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openSavePicker = (place: PlaceMarker) => {
    if (trips.length === 0) {
      Alert.alert('Create a group first', 'Add a group on the Home screen before saving places.');
      return;
    }
    setPlaceToSave(place);
  };

  const handleSavePlace = async (tripId: string) => {
    if (!placeToSave) {
      return;
    }

    setIsSavingPlace(true);
    try {
      await savePlaceToTrip(tripId, placeToSave);
      setSelectedTripId(tripId);
      setSavedPlaces(await getTripPlaces(tripId));
      setPlaceToSave(null);
      Alert.alert('Place saved', `${placeToSave.name} was added to the group.`);
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

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea}>
        <MapView
          initialRegion={{
            ...MANILA_CENTER,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
          style={StyleSheet.absoluteFillObject}
        >
          <Marker coordinate={MANILA_CENTER} pinColor={AutumnColors.primary} title="Manila" />
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

        <View style={[styles.mapOverlay, { paddingTop: insets.top + 12 }]}>
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
              value={destination || 'Manila'}
              editable={false}
              accessibilityLabel="Destination"
            />
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

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
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
            <View style={styles.filterRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChips}
              >
                {FILTERS.map((filter) => (
                  <PreferenceFilterChip
                    key={filter.id}
                    label={filter.label}
                    active={activeFilters.has(filter.id)}
                    onPress={() => toggleFilter(filter.id)}
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
                  actionLabel={`Save ${item.name} to a group`}
                  onActionPress={() => openSavePicker(item)}
                />
              )}
              contentContainerStyle={styles.placeList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.placeSeparator} />}
              ListEmptyComponent={
                !isLoading ? <Text style={styles.emptyDescription}>No matching places found.</Text> : null
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
              <FlatList
                data={savedPlaces}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <PlaceCard
                    category={formatPlaceType(item.primary_type)}
                    name={item.name}
                    location={item.address ?? 'Address unavailable'}
                    rating={item.rating}
                    status={`${item.vote_count} ${item.vote_count === 1 ? 'vote' : 'votes'}`}
                    actionLabel={item.current_user_voted ? 'Remove vote' : 'Vote for place'}
                    onActionPress={() => void handleToggleVote(item)}
                  />
                )}
                contentContainerStyle={styles.placeList}
                ItemSeparatorComponent={() => <View style={styles.placeSeparator} />}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {activeTab === 'goals' && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyTitle}>No travel goals yet!</Text>
            <Text style={styles.emptyDescription}>
              Add a goal for your next adventure.
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={placeToSave !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaceToSave(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save to a group</Text>
            <Text style={styles.modalDescription} numberOfLines={2}>
              {placeToSave?.name}
            </Text>
            <View style={styles.modalTripList}>
              {trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  disabled={isSavingPlace}
                  onPress={() => void handleSavePlace(trip.id)}
                  style={styles.modalTripButton}
                >
                  <Text style={styles.modalTripText}>{trip.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    top: 0,
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
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    fontSize: 13,
    color: AutumnColors.chipText,
    padding: 0,
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
  bottomPanel: {
    backgroundColor: AutumnColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: '55%',
  },
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterChips: {
    gap: 8,
  },
  placeList: {
    paddingBottom: 8,
  },
  placeSeparator: {
    height: 10,
  },
  emptySection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: AutumnColors.background,
    padding: 22,
  },
  modalTitle: {
    color: AutumnColors.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  modalDescription: {
    color: AutumnColors.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  modalTripList: {
    gap: 10,
  },
  modalTripButton: {
    borderRadius: 12,
    backgroundColor: AutumnColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTripText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCancelButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: AutumnColors.body,
    fontSize: 13,
    fontWeight: '600',
  },
});
