import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import {
  createTravelTrack,
  getTravelTracks,
  type TrackPoint,
  type TravelTrack,
} from '@/lib/api';

const MANILA_CENTER = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function distanceBetween(a: TrackPoint, b: TrackPoint): number {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const latitudeA = toRadians(a.latitude);
  const latitudeB = toRadians(b.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA)
      * Math.cos(latitudeB)
      * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

function getPathDistance(path: TrackPoint[]): number {
  return path.slice(1).reduce(
    (total, point, index) => total + distanceBetween(path[index], point),
    0,
  );
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function TravelTracksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const startedAtRef = useRef<Date | null>(null);

  const [tracks, setTracks] = useState<TravelTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState<TrackPoint[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [trackName, setTrackName] = useState('My Pinara journey');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TravelTrack | null>(null);

  const liveDistanceMeters = useMemo(() => getPathDistance(path), [path]);
  const displayedPath = selectedTrack?.path ?? path;
  const displayedDistanceMeters = selectedTrack?.distance_meters ?? liveDistanceMeters;
  const displayedDurationSeconds = selectedTrack?.duration_seconds ?? elapsedSeconds;

  const loadTracks = useCallback(async () => {
    setIsLoadingTracks(true);
    try {
      setTracks(await getTravelTracks());
    } catch (error) {
      Alert.alert(
        'Unable to load tracked routes',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoadingTracks(false);
    }
  }, []);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  useEffect(() => {
    if (!isTracking || !startedAtRef.current) return;
    const timer = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt) {
        setElapsedSeconds(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isTracking]);

  useEffect(() => () => {
    subscriptionRef.current?.remove();
  }, []);

  const fitPath = useCallback((points: TrackPoint[]) => {
    if (points.length === 0) return;
    mapRef.current?.fitToCoordinates(points, {
      animated: true,
      edgePadding: { top: 90, right: 50, bottom: 90, left: 50 },
    });
  }, []);

  const startTracking = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        'Location permission needed',
        'Allow location access while using Pinara to record your route.',
      );
      return;
    }

    if (!(await Location.hasServicesEnabledAsync())) {
      Alert.alert('Turn on location', 'Enable device location services before tracking.');
      return;
    }

    try {
      const firstLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const firstPoint: TrackPoint = {
        latitude: firstLocation.coords.latitude,
        longitude: firstLocation.coords.longitude,
        recorded_at: new Date(firstLocation.timestamp).toISOString(),
      };

      subscriptionRef.current?.remove();
      startedAtRef.current = new Date();
      setSelectedTrack(null);
      setPath([firstPoint]);
      setElapsedSeconds(0);
      setEndedAt(null);
      setIsTracking(true);
      mapRef.current?.animateToRegion(
        { ...firstPoint, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500,
      );

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        (location) => {
          const point: TrackPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            recorded_at: new Date(location.timestamp).toISOString(),
          };
          setPath((current) => {
            const previous = current[current.length - 1];
            if (previous && distanceBetween(previous, point) < 2) return current;
            return [...current, point];
          });
          mapRef.current?.animateCamera(
            { center: point, zoom: 17 },
            { duration: 450 },
          );
        },
      );
    } catch (error) {
      setIsTracking(false);
      Alert.alert(
        'Unable to start tracking',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const stopTracking = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsTracking(false);
    const stoppedAt = new Date();
    setEndedAt(stoppedAt);

    if (path.length < 2) {
      Alert.alert(
        'Not enough movement recorded',
        'Move at least a few meters before saving, or discard this track.',
      );
      return;
    }

    setTrackName(`Journey on ${stoppedAt.toLocaleDateString()}`);
    setShowSaveModal(true);
    fitPath(path);
  };

  const saveTrack = async () => {
    const startedAt = startedAtRef.current;
    if (!startedAt || !endedAt || path.length < 2 || !trackName.trim()) return;

    setIsSaving(true);
    try {
      const savedTrack = await createTravelTrack({
        name: trackName.trim(),
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: elapsedSeconds,
        distance_meters: liveDistanceMeters,
        path,
      });
      setTracks((current) => [savedTrack, ...current]);
      setSelectedTrack(savedTrack);
      setPath([]);
      startedAtRef.current = null;
      setShowSaveModal(false);
      Alert.alert('Track saved', 'Your traveled path is now saved in Pinara.');
    } catch (error) {
      Alert.alert(
        'Unable to save track',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const discardTrack = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    startedAtRef.current = null;
    setIsTracking(false);
    setPath([]);
    setElapsedSeconds(0);
    setEndedAt(null);
    setShowSaveModal(false);
  };

  const viewSavedTrack = (track: TravelTrack) => {
    setSelectedTrack(track);
    setPath([]);
    fitPath(track.path);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Return to home"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons color={AutumnColors.heading} name="arrow-back" size={22} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>My Tracks</Text>
          <Text style={styles.subtitle}>Record and save where you have traveled</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          initialRegion={MANILA_CENTER}
          showsUserLocation
          style={StyleSheet.absoluteFillObject}
        >
          {displayedPath.length > 0 ? (
            <>
              <Polyline
                coordinates={displayedPath}
                strokeColor={AutumnColors.primary}
                strokeWidth={6}
              />
              <Marker coordinate={displayedPath[0]} title="Start" pinColor="#5F7A36" />
              {displayedPath.length > 1 ? (
                <Marker
                  coordinate={displayedPath[displayedPath.length - 1]}
                  title={isTracking ? 'Current position' : 'Finish'}
                  pinColor={AutumnColors.primary}
                />
              ) : null}
            </>
          ) : null}
        </MapView>

        <View style={styles.liveStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{(displayedDistanceMeters / 1000).toFixed(2)}</Text>
            <Text style={styles.statLabel}>KILOMETERS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(displayedDurationSeconds)}</Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        {isTracking ? (
          <TouchableOpacity onPress={stopTracking} style={styles.stopButton}>
            <Ionicons color="#FFFFFF" name="stop" size={20} />
            <Text style={styles.primaryButtonText}>Finish tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => void startTracking()} style={styles.startButton}>
            <Ionicons color="#FFFFFF" name="navigate" size={20} />
            <Text style={styles.primaryButtonText}>Start tracking</Text>
          </TouchableOpacity>
        )}
        {!isTracking && path.length > 0 ? (
          <TouchableOpacity onPress={discardTrack} style={styles.discardButton}>
            <Text style={styles.discardText}>Discard current track</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.savedSection}>
        <Text style={styles.savedTitle}>Saved journeys</Text>
        {isLoadingTracks ? (
          <ActivityIndicator color={AutumnColors.primary} />
        ) : tracks.length === 0 ? (
          <Text style={styles.emptyText}>Your saved tracks will appear here.</Text>
        ) : (
          <FlatList
            data={tracks}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedList}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => viewSavedTrack(item)} style={styles.trackCard}>
                <Ionicons color={AutumnColors.primary} name="trail-sign-outline" size={22} />
                <Text numberOfLines={1} style={styles.trackName}>{item.name}</Text>
                <Text style={styles.trackMeta}>
                  {(item.distance_meters / 1000).toFixed(2)} km · {formatDuration(item.duration_seconds)}
                </Text>
                <Text style={styles.trackDate}>
                  {new Date(item.started_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save this journey?</Text>
            <Text style={styles.modalSummary}>
              {(liveDistanceMeters / 1000).toFixed(2)} km in {formatDuration(elapsedSeconds)}
            </Text>
            <TextInput
              autoFocus
              maxLength={80}
              onChangeText={setTrackName}
              placeholder="Journey name"
              style={styles.nameInput}
              value={trackName}
            />
            <TouchableOpacity
              disabled={isSaving || !trackName.trim()}
              onPress={() => void saveTrack()}
              style={[styles.saveButton, isSaving && styles.disabledButton]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Save highlighted route</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity disabled={isSaving} onPress={discardTrack} style={styles.modalDiscard}>
              <Text style={styles.discardText}>Discard route</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AutumnColors.background },
  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  title: { color: AutumnColors.heading, fontSize: 20, fontWeight: '800' },
  subtitle: { color: AutumnColors.body, fontSize: 11, marginTop: 2 },
  mapContainer: { height: '48%', backgroundColor: '#E9E6DE' },
  liveStats: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 14,
    minHeight: 70,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: AutumnColors.chipBorder },
  statValue: { color: AutumnColors.heading, fontSize: 22, fontWeight: '800' },
  statLabel: { color: AutumnColors.body, fontSize: 9, fontWeight: '700', marginTop: 2 },
  controls: { paddingHorizontal: 20, paddingTop: 14, alignItems: 'center' },
  startButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#5F7A36',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: AutumnColors.primary,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  discardButton: { paddingTop: 9, paddingHorizontal: 14 },
  discardText: { color: '#A52235', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  savedSection: { flex: 1, paddingTop: 12, paddingHorizontal: 20 },
  savedTitle: { color: AutumnColors.heading, fontSize: 16, fontWeight: '800', marginBottom: 9 },
  savedList: { gap: 10, paddingBottom: 16 },
  trackCard: {
    width: 190,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  trackName: { color: AutumnColors.heading, fontSize: 13, fontWeight: '700', marginTop: 5 },
  trackMeta: { color: AutumnColors.primary, fontSize: 11, fontWeight: '700', marginTop: 4 },
  trackDate: { color: AutumnColors.body, fontSize: 10, marginTop: 3 },
  emptyText: { color: AutumnColors.body, fontSize: 13, textAlign: 'center', paddingTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: { width: '100%', borderRadius: 18, backgroundColor: '#FFFFFF', padding: 22 },
  modalTitle: { color: AutumnColors.heading, fontSize: 20, fontWeight: '800' },
  modalSummary: { color: AutumnColors.body, fontSize: 13, marginTop: 6, marginBottom: 16 },
  nameInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    color: AutumnColors.heading,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDiscard: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.6 },
});
