import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  type PlaceMarker,
  type PreferenceKey,
  searchNearbyPlaces,
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
          <View style={styles.emptySection}>
            <Text style={styles.emptyTitle}>No plans yet!</Text>
            <Text style={styles.emptyDescription}>
              The blue line currently previews a live route to the first recommendation.
            </Text>
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
});
