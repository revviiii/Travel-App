import { useCallback, useState } from 'react';
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
  getMyProfile,
  getTrips,
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
  currentUserRole: TripSummary['current_user_role'];
}

function toGroupData(trip: TripSummary): GroupData {
  return {
    id: trip.id,
    name: trip.name,
    memberCount: trip.member_count,
    currentUserRole: trip.current_user_role,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Planner tab state
  const [activeTab, setActiveTab] = useState<PlannerSection>('group');

  // Destination search
  const [destination, setDestination] = useState('Manila');

  // Group state
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Goals state
  const [goals, setGoals] = useState<TravelGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const [userName, setUserName] = useState('Traveler');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const handleProfilePress = useCallback(() => {
    router.push('/Userprofile' as RelativePathString);
  }, [router]);

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

  const handleLongPressGroup = useCallback((id: string) => {
    setGroupToDelete(id);
  }, []);

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
      void Promise.all([getMyProfile(), supabase.auth.getSession()])
        .then(([profile, sessionResult]) => {
          if (!isCurrent) return;
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
    }, [loadGoals, loadGroups]),
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
        onPress={() => {
          const path = `/group/${item.id}` as RelativePathString;
          router.push(path);
        }}
        onLongPress={
          item.currentUserRole === 'owner'
            ? () => handleLongPressGroup(item.id)
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
              <Ionicons color={AutumnColors.body} name="notifications-outline" size={20} />
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
          <TouchableOpacity
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            hitSlop={10}
            onPress={handleProfilePress}
            style={styles.profileButton}
          >
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
          </TouchableOpacity>
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
        accessibilityLabel="Open live Manila map"
        onPress={handleSearchSubmit}
        style={styles.mapPlaceholder}
      >
        <MapView
          initialRegion={{
            ...MANILA_CENTER,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        >
          <Marker coordinate={MANILA_CENTER} title="Manila" />
        </MapView>
        <View style={styles.mapPreviewLabel}>
          <Text style={styles.mapPlaceholderText}>Open live recommendations</Text>
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
