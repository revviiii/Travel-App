import { Image } from 'expo-image';
import { useRouter, type RelativePathString } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PlannerTab } from '@/components/home/PlannerTab';
import { EmptyState } from '@/components/home/EmptyState';
import { GroupCard } from '@/components/home/GroupCard';
import { CreateGroupModal } from '@/components/home/CreateGroupModal';
import { TravelGoalCard } from '@/components/home/TravelGoalCard';
import { TravelGoalInput } from '@/components/home/TravelGoalInput';
import { useSoloGoals, type SoloGoal } from '@/contexts/SoloGoalsContext';

const settingsIcon = require('@/assets/images/settings_ic.svg');

type PlannerSection = 'group' | 'itinerary' | 'goals';

interface GroupData {
  id: string;
  name: string;
  /**
   * Temporary placeholder member count for UI testing.
   * TODO: Replace with actual member data from backend.
   */
  memberCount: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Planner tab state
  const [activeTab, setActiveTab] = useState<PlannerSection>('group');

  // Destination search
  const [destination, setDestination] = useState('');

  // Group state
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Solo Goals — shared state via Context
  const { goals, addGoal, removeGoal } = useSoloGoals();
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // TODO: Replace with authenticated user's profile name
  const userName = 'Traveler';

  const handleProfilePress = useCallback(() => {
    router.push('/Userprofile');
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    // TODO: Navigate to the settings screen when that route is implemented
  }, []);

  // --- Search ---
  const handleSearchSubmit = useCallback(() => {
    const trimmed = destination.trim();
    if (trimmed.length > 0) {
      // TODO: Replace local destination behavior with Places/Maps API results
      const path = `/discovery?destination=${encodeURIComponent(trimmed)}` as RelativePathString;
      router.push(path);
    }
  }, [destination, router]);

  // --- Groups ---
  const handleCreateGroup = useCallback((name: string) => {
    // TODO: Persist groups through backend/API
    setGroups((prev) => [
      ...prev,
      { id: Date.now().toString(), name, memberCount: 0 },
    ]);
    setShowCreateGroup(false);
  }, []);

  const handleLongPressGroup = useCallback((id: string) => {
    setGroupToDelete(id);
  }, []);

  const handleConfirmDeleteGroup = useCallback(() => {
    if (groupToDelete !== null) {
      // TODO: Delete group through backend/API when integration is implemented
      setGroups((prev) => prev.filter((g) => g.id !== groupToDelete));
      setGroupToDelete(null);
    }
  }, [groupToDelete]);

  const handleCancelDeleteGroup = useCallback(() => {
    setGroupToDelete(null);
  }, []);

  // --- Goals ---
  const handleAddGoal = useCallback((text: string) => {
    addGoal(text);
  }, [addGoal]);

  const handleLongPressGoal = useCallback((id: string) => {
    setGoalToDelete(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (goalToDelete !== null) {
      removeGoal(goalToDelete);
      setGoalToDelete(null);
    }
  }, [goalToDelete, removeGoal]);

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
          // TODO: Replace temporary group ID with backend-generated groupId
          const path = `/group/${item.id}` as RelativePathString;
          router.push(path);
        }}
        onLongPress={() => handleLongPressGroup(item.id)}
      />
    ),
    [handleLongPressGroup, router],
  );

  const renderGoalItem = useCallback(
    ({ item }: { item: SoloGoal }) => (
      <TravelGoalCard text={item.text} onLongPress={() => handleLongPressGoal(item.id)} />
    ),
    [handleLongPressGoal],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'group':
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
        return (
          <EmptyState
            title="No plans yet!"
            description="Add places to start your adventure."
          />
        );

      case 'goals':
        return (
          <View style={styles.goalsContainer}>
            {/* Section header */}
            <View style={styles.goalsHeader}>
              <Text style={styles.goalsTitle}>TRAVEL GOALS</Text>
              {/* TODO: Replace with final Figma SVG icon */}
              <View style={styles.bellPlaceholder} />
            </View>

            {/* Goal input */}
            <TravelGoalInput onAdd={handleAddGoal} />

            {/* Goal list or empty state */}
            {goals.length === 0 ? (
              <EmptyState
                title="No travel goals yet!"
                description="Add a goal for your next adventure."
              />
            ) : (
              <FlatList
                data={goals}
                keyExtractor={(item) => item.id}
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
          {/* TODO: Replace with user profile/avatar */}
          <TouchableOpacity
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            hitSlop={10}
            onPress={handleProfilePress}
            style={styles.profileButton}
          >
            <View style={styles.avatarPlaceholder} />
          </TouchableOpacity>
          <Text style={styles.greeting}>Hello, {userName}</Text>
        </View>

        {/* Settings icon */}
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

      {/* Main heading */}
      <Text style={styles.heading}>
        Where do you{'\n'}want to explore today?
      </Text>

      {/* Map placeholder */}
      {/* TODO: Replace with real map component when maps/API integration is implemented */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>MAP PLACEHOLDER</Text>
      </View>

      {/* Search / destination field */}
      <View style={styles.searchContainer}>
        {/* TODO: Replace with final Figma location/search SVG */}
        <View style={styles.searchIconPlaceholder} />
        {/* TODO: Connect destination search to Places/Maps API */}
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
    backgroundColor: '#EDE9E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: AutumnColors.body,
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
