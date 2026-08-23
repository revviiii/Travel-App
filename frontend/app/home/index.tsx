import { useCallback, useEffect, useState } from 'react';
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type RelativePathString } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PlannerTab } from '@/components/home/PlannerTab';
import { EmptyState } from '@/components/home/EmptyState';
import { GroupCard } from '@/components/home/GroupCard';
import { CreateGroupModal } from '@/components/home/CreateGroupModal';
import { TravelGoalCard } from '@/components/home/TravelGoalCard';
import { TravelGoalInput } from '@/components/home/TravelGoalInput';
import {
  createTravelGoal,
  createTrip,
  deleteTravelGoal,
  deleteTrip,
  getTravelGoals,
  getMyPreferences,
  getMyProfile,
  getTrips,
  searchPlacesByText,
  updateTrip,
  TravelGoal,
  TripSummary,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';

const settingsIcon = require('@/assets/images/settings_ic.svg');

const MANILA_CENTER = {
  latitude: 14.5995,
  longitude: 120.9842,
};

type PlannerSection = 'group' | 'itinerary' | 'goals';

interface GroupData {
  id: string;
  name: string;
  memberCount: number;
  memberPreview: TripSummary['member_preview'];
  currentUserRole: TripSummary['current_user_role'];
  imageUrl: string | null;
}

function toGroupData(trip: TripSummary): GroupData {
  return {
    id: trip.id,
    name: trip.name,
    memberCount: trip.member_count,
    memberPreview: trip.member_preview ?? [],
    currentUserRole: trip.current_user_role,
    imageUrl: trip.image_url,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Planner tab state
  const [activeTab, setActiveTab] = useState<PlannerSection>('group');

  // Destination search
  const [destination, setDestination] = useState('');
  const [mapCenter, setMapCenter] = useState(MANILA_CENTER);
  const [mapLabel, setMapLabel] = useState('Manila');
  const [isResolvingMap, setIsResolvingMap] = useState(false);

  // Group state
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [groupToManage, setGroupToManage] = useState<GroupData | null>(null);
  const [managedGroupName, setManagedGroupName] = useState('');
  const [managedGroupPhoto, setManagedGroupPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<TravelGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const [userName, setUserName] = useState('Traveler');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const handleSettingsPress = useCallback(() => {
    router.push('/Userprofile' as RelativePathString);
  }, [router]);

  const handleTracksPress = useCallback(() => {
    router.push('/tracks' as RelativePathString);
  }, [router]);

  // --- Search ---
  const handleSearchSubmit = useCallback(() => {
    const trimmed = destination.trim();
    const selectedDestination = trimmed || 'Manila';
    const path = `/discovery?destination=${encodeURIComponent(selectedDestination)}` as RelativePathString;
    router.push(path);
  }, [destination, router]);

  useEffect(() => {
    let isCurrent = true;

    async function showCurrentLocation() {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return;

      const position = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 2000,
      }) ?? await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!isCurrent) return;

      const nextCenter = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setMapCenter(nextCenter);

      try {
        const [address] = await Location.reverseGeocodeAsync(nextCenter);
        const currentPlace = address?.city
          ?? address?.subregion
          ?? address?.region
          ?? address?.country;
        if (isCurrent && currentPlace) {
          setDestination(currentPlace);
          setMapLabel(currentPlace);
        }
      } catch {
        if (isCurrent) setMapLabel('Your current location');
      }
    }

    void showCurrentLocation().catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const query = destination.trim();
    if (query.length < 2) return;

    let isCurrent = true;
    const timer = setTimeout(() => {
      setIsResolvingMap(true);
      void searchPlacesByText(query)
        .then(({ places }) => {
          const firstPlace = places[0];
          if (!isCurrent || !firstPlace) return;
          setMapCenter(firstPlace.location);
          setMapLabel(firstPlace.name || query);
        })
        .catch(() => undefined)
        .finally(() => {
          if (isCurrent) setIsResolvingMap(false);
        });
    }, 650);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [destination]);

  // --- Groups ---
  const loadGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    setGroupError(null);
    try {
      const trips = await getTrips();
      setGroups(trips.map(toGroupData));
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : 'Unable to load groups.');
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const handleCreateGroup = useCallback(async (name: string) => {
    try {
      const trip = await createTrip(name);
      setGroups((prev) => [toGroupData(trip), ...prev]);
      setShowCreateGroup(false);
    } catch (error) {
      Alert.alert(
        'Unable to create group',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, []);

  const handleLongPressGroup = useCallback((group: GroupData) => {
    setGroupToManage(group);
    setManagedGroupName(group.name);
    setManagedGroupPhoto(null);
  }, []);

  const handleChooseGroupPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      mediaTypes: ['images'],
      quality: 0.75,
    });
    if (!result.canceled && result.assets[0]) {
      setManagedGroupPhoto(result.assets[0]);
    }
  }, []);

  const handleSaveGroup = useCallback(async () => {
    if (!groupToManage || !managedGroupName.trim()) return;
    setIsSavingGroup(true);
    try {
      let imageUrl = groupToManage.imageUrl ?? undefined;
      if (managedGroupPhoto) {
        const { data: userResult, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userResult.user) throw new Error('Sign in again before changing a group photo.');

        const photoResponse = await fetch(managedGroupPhoto.uri);
        if (!photoResponse.ok) throw new Error('Pinara could not read the selected photo.');
        const photoBytes = await photoResponse.arrayBuffer();
        const contentType = managedGroupPhoto.mimeType?.startsWith('image/')
          ? managedGroupPhoto.mimeType
          : 'image/jpeg';
        const extension = contentType === 'image/png' ? 'png' : 'jpg';
        const storagePath = `${userResult.user.id}/${groupToManage.id}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('trip-images')
          .upload(storagePath, photoBytes, {
            cacheControl: '3600',
            contentType,
            upsert: true,
          });
        if (uploadError) throw uploadError;
        const { data: publicUrlResult } = supabase.storage
          .from('trip-images')
          .getPublicUrl(storagePath);
        imageUrl = `${publicUrlResult.publicUrl}?v=${Date.now()}`;
      }

      const updatedTrip = await updateTrip(groupToManage.id, {
        name: managedGroupName.trim(),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      const updatedGroup = toGroupData(updatedTrip);
      setGroups((current) => current.map((group) => (
        group.id === updatedGroup.id ? updatedGroup : group
      )));
      setGroupToManage(null);
      setManagedGroupPhoto(null);
      Alert.alert('Group updated', 'The group name and picture are saved.');
    } catch (error) {
      Alert.alert(
        'Unable to update group',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingGroup(false);
    }
  }, [groupToManage, managedGroupName, managedGroupPhoto]);

  const handleManageDelete = useCallback(() => {
    if (!groupToManage) return;
    setGroupToDelete(groupToManage.id);
    setGroupToManage(null);
  }, [groupToManage]);

  const handleConfirmDeleteGroup = useCallback(async () => {
    if (groupToDelete !== null) {
      try {
        await deleteTrip(groupToDelete);
        setGroups((prev) => prev.filter((group) => group.id !== groupToDelete));
        setGroupToDelete(null);
      } catch (error) {
        Alert.alert(
          'Unable to delete group',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    }
  }, [groupToDelete]);

  const handleCancelDeleteGroup = useCallback(() => {
    setGroupToDelete(null);
  }, []);

  // --- Goals ---
  const loadGoals = useCallback(async () => {
    setIsLoadingGoals(true);
    setGoalError(null);
    try {
      setGoals(await getTravelGoals());
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : 'Unable to load goals.');
    } finally {
      setIsLoadingGoals(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      void loadGroups();
      void loadGoals();
      void Promise.all([getMyProfile(), getMyPreferences(), supabase.auth.getSession()])
        .then(([profile, preferences, sessionResult]) => {
          if (!isCurrent) return;
          // Onboarding check uses only the persisted flag — not preference count.
          // An onboarded user with 0 preferences is valid and stays on Home.
          if (!profile.onboarding_completed) {
            router.replace('/preferences');
            return;
          }
          const sessionUser = sessionResult.data.session?.user;
          setUserName(profile.full_name || 'Traveler');
          setUserAvatarUrl(
            profile.avatar_url
              ?? sessionUser?.user_metadata?.avatar_url
              ?? sessionUser?.user_metadata?.picture
              ?? null,
          );
        })
        .catch(() => undefined);

      return () => {
        isCurrent = false;
      };
    }, [loadGoals, loadGroups, router]),
  );

  const handleAddGoal = useCallback(async (goalText: string) => {
    try {
      const goal = await createTravelGoal(goalText);
      setGoals((prev) => [goal, ...prev]);
    } catch (error) {
      Alert.alert(
        'Unable to add goal',
        error instanceof Error ? error.message : 'Please try again.',
      );
      throw error;
    }
  }, []);

  const handleLongPressGoal = useCallback((id: string) => {
    setGoalToDelete(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (goalToDelete !== null) {
      try {
        await deleteTravelGoal(goalToDelete);
        setGoals((prev) => prev.filter((goal) => goal.id !== goalToDelete));
        setGoalToDelete(null);
      } catch (error) {
        Alert.alert(
          'Unable to delete goal',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    }
  }, [goalToDelete]);

  const handleCancelDelete = useCallback(() => {
    setGoalToDelete(null);
  }, []);

  // --- Renderers ---
  const renderGroupItem = useCallback(
    ({ item }: { item: GroupData }) => (
      <GroupCard
        name={item.name}
        memberCount={item.memberCount}
        memberPreview={item.memberPreview}
        imageUrl={item.imageUrl}
        onPress={() => {
          const path = `/group/${item.id}` as RelativePathString;
          router.push(path);
        }}
        onLongPress={
          item.currentUserRole === 'owner' || item.currentUserRole === 'admin'
            ? () => handleLongPressGroup(item)
            : undefined
        }
        onMenuPress={
          item.currentUserRole === 'owner' || item.currentUserRole === 'admin'
            ? () => handleLongPressGroup(item)
            : undefined
        }
      />
    ),
    [handleLongPressGroup, router],
  );

  const renderGoalItem = useCallback(
    ({ item }: { item: TravelGoal }) => (
      <TravelGoalCard
        text={item.goal_text}
        onLongPress={() => handleLongPressGoal(item.id)}
      />
    ),
    [handleLongPressGoal],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'group':
        if (isLoadingGroups) {
          return (
            <View style={styles.groupStatus}>
              <ActivityIndicator color={AutumnColors.primary} />
              <Text style={styles.groupStatusText}>Loading groups...</Text>
            </View>
          );
        }
        if (groupError) {
          return (
            <View style={styles.groupStatus}>
              <Text style={styles.groupErrorText}>{groupError}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Retry loading groups"
                onPress={() => void loadGroups()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          );
        }
        if (groups.length === 0) {
          return (
            <View style={styles.groupSection}>
              <View style={styles.groupFlatList}>
                <EmptyState
                  title="No group yet!"
                  description="Create a group and start planning together."
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowCreateGroup(true)}
                accessibilityRole="button"
                accessibilityLabel="Add New Group"
                style={styles.addGroupButton}
              >
                <Text style={styles.addGroupText}>Add New Group</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <View style={styles.groupSection}>
            <FlatList
              data={groups}
              keyExtractor={(item) => item.id}
              renderItem={renderGroupItem}
              contentContainerStyle={styles.groupList}
              showsVerticalScrollIndicator={false}
              style={styles.groupFlatList}
              ItemSeparatorComponent={() => <View style={styles.groupSeparator} />}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCreateGroup(true)}
              accessibilityRole="button"
              accessibilityLabel="Add New Group"
              style={styles.addGroupButton}
            >
              <Text style={styles.addGroupText}>Add New Group</Text>
            </TouchableOpacity>
          </View>
        );

      case 'itinerary':
        if (isLoadingGroups) {
          return (
            <View style={styles.groupStatus}>
              <ActivityIndicator color={AutumnColors.primary} />
              <Text style={styles.groupStatusText}>Loading itineraries...</Text>
            </View>
          );
        }
        if (groupError) {
          return (
            <View style={styles.groupStatus}>
              <Text style={styles.groupErrorText}>{groupError}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Retry loading itineraries"
                onPress={() => void loadGroups()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          );
        }
        if (groups.length > 0) {
          return (
            <View style={styles.groupSection}>
              <Text style={styles.itineraryIntro}>
                Choose a group to review saved places, vote, and finalize its schedule.
              </Text>
              <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={renderGroupItem}
                contentContainerStyle={styles.groupList}
                showsVerticalScrollIndicator={false}
                style={styles.groupFlatList}
                ItemSeparatorComponent={() => <View style={styles.groupSeparator} />}
              />
            </View>
          );
        }
        return (
          <EmptyState
            title="No plans yet!"
            description="Create a group, discover places, then build its shared itinerary."
          />
        );

      case 'goals':
        return (
          <View style={styles.goalsContainer}>
            {/* Section header */}
            <View style={styles.goalsHeader}>
              <Text style={styles.goalsTitle}>TRAVEL GOALS</Text>
            </View>

            {/* Goal input */}
            <TravelGoalInput onAdd={handleAddGoal} />

            {/* Goal list or empty state */}
            {isLoadingGoals ? (
              <View style={styles.groupStatus}>
                <ActivityIndicator color={AutumnColors.primary} />
                <Text style={styles.groupStatusText}>Loading goals...</Text>
              </View>
            ) : goalError ? (
              <View style={styles.groupStatus}>
                <Text style={styles.groupErrorText}>{goalError}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading goals"
                  onPress={() => void loadGoals()}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : goals.length === 0 ? (
              <EmptyState
                title="No travel goals yet!"
                description="Add a goal for your next adventure."
              />
            ) : (
              <FlatList
                data={goals}
                keyExtractor={(goal) => goal.id}
                renderItem={renderGoalItem}
                contentContainerStyle={styles.goalsList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.goalSeparator} />}
              />
            )}
          </View>
        );
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      {/* Header: profile, greeting, and settings */}
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <View style={styles.profileButton}>
            {userAvatarUrl ? (
              <Image
                accessibilityLabel={`${userName}'s profile photo`}
                contentFit="cover"
                source={{ uri: userAvatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons color={AutumnColors.body} name="person" size={19} />
              </View>
            )}
          </View>
          <Text style={styles.greeting}>Hello, {userName}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityLabel="Open my tracked routes"
            accessibilityRole="button"
            hitSlop={10}
            onPress={handleTracksPress}
            style={styles.settingsButton}
          >
            <Ionicons color={AutumnColors.heading} name="footsteps-outline" size={21} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            hitSlop={10}
            onPress={handleSettingsPress}
            style={styles.settingsButton}
          >
            <Image source={settingsIcon} style={styles.settingsIcon} contentFit="contain" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main heading */}
      <Text style={styles.heading}>
        Where do you{'\n'}want to explore today?
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Open recommendations near ${mapLabel}`}
        onPress={handleSearchSubmit}
        style={styles.mapPlaceholder}
      >
        <MapView
          region={{
            ...mapCenter,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        >
          <Marker coordinate={mapCenter} title={mapLabel} />
        </MapView>
        {isResolvingMap ? (
          <View style={styles.mapLoadingBadge}>
            <ActivityIndicator color={AutumnColors.primary} size="small" />
          </View>
        ) : null}
        <View style={styles.mapPreviewLabel}>
          <Text numberOfLines={1} style={styles.mapPlaceholderText}>
            Explore {mapLabel}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Search / destination field */}
      <View style={styles.searchContainer}>
        <Ionicons color={AutumnColors.body} name="search" size={18} />
        <TextInput
          style={styles.searchInput}
          value={destination}
          onChangeText={setDestination}
          onSubmitEditing={handleSearchSubmit}
          placeholder="Where do you want to go"
          placeholderTextColor={AutumnColors.body}
          returnKeyType="search"
          accessibilityLabel="Destination search"
          accessibilityHint="Type a destination and press search"
        />
      </View>

      <TouchableOpacity
        accessibilityLabel="Open My Tracks route recorder"
        accessibilityRole="button"
        onPress={handleTracksPress}
        style={styles.tracksShortcut}
      >
        <View style={styles.tracksShortcutIcon}>
          <Ionicons color="#FFFFFF" name="footsteps" size={18} />
        </View>
        <View style={styles.tracksShortcutCopy}>
          <Text style={styles.tracksShortcutTitle}>My Tracks</Text>
          <Text style={styles.tracksShortcutSubtitle}>Record and save where you traveled</Text>
        </View>
        <Ionicons color={AutumnColors.body} name="chevron-forward" size={19} />
      </TouchableOpacity>

      {/* Planner tabs — centered */}
      <View style={styles.tabRow}>
        <PlannerTab
          label="Group"
          active={activeTab === 'group'}
          onPress={() => setActiveTab('group')}
        />
        <PlannerTab
          label="My Itinerary"
          active={activeTab === 'itinerary'}
          onPress={() => setActiveTab('itinerary')}
        />
        <PlannerTab
          label="My Goals"
          active={activeTab === 'goals'}
          onPress={() => setActiveTab('goals')}
        />
      </View>

      {/* Dynamic content area */}
      <View style={styles.contentArea}>
        {renderContent()}
      </View>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateGroup}
        onCancel={() => setShowCreateGroup(false)}
        onCreate={handleCreateGroup}
      />

      {/* Long-press group manager */}
      <Modal
        visible={groupToManage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGroupToManage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manage group</Text>
            <Text style={styles.modalDescription}>
              Rename the group, choose a new picture, or delete it.
            </Text>
            <TouchableOpacity
              accessibilityLabel="Choose group picture"
              accessibilityRole="button"
              onPress={() => void handleChooseGroupPhoto()}
              style={styles.groupPhotoPicker}
            >
              {managedGroupPhoto?.uri || groupToManage?.imageUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: managedGroupPhoto?.uri ?? groupToManage?.imageUrl ?? '' }}
                  style={styles.groupPhotoPreview}
                />
              ) : (
                <View style={styles.groupPhotoPlaceholder}>
                  <Ionicons color={AutumnColors.primary} name="image-outline" size={26} />
                </View>
              )}
              <Text style={styles.groupPhotoText}>Choose picture</Text>
            </TouchableOpacity>
            {groupToManage?.imageUrl && !managedGroupPhoto ? (
              <TouchableOpacity
                accessibilityLabel="Remove group photo"
                accessibilityRole="button"
                disabled={isSavingGroup}
                onPress={() => {
                  // Clear the custom group image via updateTrip({ image_url: null })
                  setManagedGroupPhoto(null);
                  void (async () => {
                    if (!groupToManage) return;
                    setIsSavingGroup(true);
                    try {
                      const updatedTrip = await updateTrip(groupToManage.id, { image_url: null });
                      const updatedGroup = toGroupData(updatedTrip);
                      setGroups((current) => current.map((g) =>
                        g.id === updatedGroup.id ? updatedGroup : g
                      ));
                      setGroupToManage(updatedGroup);
                    } catch (error) {
                      Alert.alert(
                        'Unable to remove photo',
                        error instanceof Error ? error.message : 'Please try again.',
                      );
                    } finally {
                      setIsSavingGroup(false);
                    }
                  })();
                }}
                style={styles.removePhotoButton}
              >
                <Ionicons color={AutumnColors.primary} name="close-circle-outline" size={16} />
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            ) : null}
            <TextInput
              accessibilityLabel="Group name"
              maxLength={120}
              onChangeText={setManagedGroupName}
              placeholder="Group name"
              placeholderTextColor={AutumnColors.body}
              style={styles.manageGroupInput}
              value={managedGroupName}
            />
            <View style={styles.manageGroupActions}>
              {groupToManage?.currentUserRole === 'owner' ? (
                <TouchableOpacity
                  accessibilityLabel="Delete group"
                  accessibilityRole="button"
                  disabled={isSavingGroup}
                  onPress={handleManageDelete}
                  style={styles.manageDeleteButton}
                >
                  <Ionicons color="#B42318" name="trash-outline" size={18} />
                  <Text style={styles.manageDeleteText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityLabel="Cancel group changes"
                accessibilityRole="button"
                disabled={isSavingGroup}
                onPress={() => setGroupToManage(null)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Save group changes"
                accessibilityRole="button"
                disabled={isSavingGroup || !managedGroupName.trim()}
                onPress={() => void handleSaveGroup()}
                style={styles.modalClearButton}
              >
                {isSavingGroup ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalClearText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear Goal Confirmation Modal */}
      <Modal
        visible={goalToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Clear this goal?</Text>
            <Text style={styles.modalDescription}>
              This will remove the selected travel goal.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleCancelDelete}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
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

      {/* Delete Group Confirmation Modal */}
      <Modal
        visible={groupToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDeleteGroup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete this group?</Text>
            <Text style={styles.modalDescription}>
              This will remove the selected group.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleCancelDeleteGroup}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDeleteGroup}
                accessibilityRole="button"
                accessibilityLabel="Delete Group"
                style={styles.modalClearButton}
              >
                <Text style={styles.modalClearText}>Delete Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.background,
    paddingHorizontal: 20,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  settingsButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AutumnColors.chipBackground,
  },
  settingsIcon: {
    width: 18,
    height: 18,
  },

  /* Heading */
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: AutumnColors.heading,
    lineHeight: 30,
    marginBottom: 14,
  },

  /* Map */
  mapPlaceholder: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EDE9E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapPreviewLabel: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: AutumnColors.primary,
  },
  mapLoadingBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 249, 241, 0.95)',
  },

  /* Search */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AutumnColors.chipBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: AutumnColors.chipText,
    padding: 0,
  },
  tracksShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 14,
    backgroundColor: AutumnColors.chipBackground,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    gap: 10,
  },
  tracksShortcutIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AutumnColors.primary,
  },
  tracksShortcutCopy: {
    flex: 1,
  },
  tracksShortcutTitle: {
    color: AutumnColors.heading,
    fontSize: 14,
    fontWeight: '700',
  },
  tracksShortcutSubtitle: {
    color: AutumnColors.body,
    fontSize: 11,
    marginTop: 1,
  },

  /* Tabs — centered row */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },

  /* Content */
  contentArea: {
    flex: 1,
  },

  /* Group section */
  groupSection: {
    flex: 1,
  },
  itineraryIntro: {
    color: AutumnColors.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  groupStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  groupStatusText: {
    color: AutumnColors.body,
    fontSize: 14,
  },
  groupErrorText: {
    color: AutumnColors.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 18,
    backgroundColor: AutumnColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  groupFlatList: {
    flex: 1,
  },
  groupList: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  groupSeparator: {
    height: 10,
  },
  addGroupButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  addGroupText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Goals */
  goalsContainer: {
    flex: 1,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AutumnColors.heading,
    letterSpacing: 0.5,
  },
  bellPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: AutumnColors.autumnAccent,
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
  groupPhotoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  groupPhotoPreview: {
    width: 64,
    height: 48,
    borderRadius: 10,
    backgroundColor: AutumnColors.chipBackground,
  },
  groupPhotoPlaceholder: {
    width: 64,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
  },
  groupPhotoText: {
    color: AutumnColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  removePhotoText: {
    color: AutumnColors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  manageGroupInput: {
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: AutumnColors.heading,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  manageGroupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 9,
  },
  manageDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 'auto',
    paddingVertical: 9,
  },
  manageDeleteText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
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
