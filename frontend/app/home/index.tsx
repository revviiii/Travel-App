import { Image } from 'expo-image';
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
import { TravelGoalCard } from '@/components/home/TravelGoalCard';
import { TravelGoalInput } from '@/components/home/TravelGoalInput';

const settingsIcon = require('@/assets/images/settings_ic.svg');

type PlannerSection = 'group' | 'itinerary' | 'goals';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlannerSection>('group');
  const [goals, setGoals] = useState<string[]>([]);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

  // TODO: Replace with authenticated user's profile name
  const userName = 'Traveler';

  const handleProfilePress = useCallback(() => {
    // TODO: Navigate to the user's profile screen
  }, []);

  const handleSettingsPress = useCallback(() => {
    // TODO: Navigate to the settings screen
  }, []);

  const handleAddGoal = useCallback((goal: string) => {
    // TODO: Persist travel goals when backend integration is implemented
    setGoals((prev) => [...prev, goal]);
  }, []);

  const handleLongPressGoal = useCallback((index: number) => {
    setGoalToDelete(index);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (goalToDelete !== null) {
      // TODO: Delete persisted goal through backend when integration is implemented
      setGoals((prev) => prev.filter((_, i) => i !== goalToDelete));
      setGoalToDelete(null);
    }
  }, [goalToDelete]);

  const handleCancelDelete = useCallback(() => {
    setGoalToDelete(null);
  }, []);

  const renderGoalItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <TravelGoalCard text={item} onLongPress={() => handleLongPressGoal(index)} />
    ),
    [handleLongPressGoal],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'group':
        return (
          <EmptyState
            title="No group yet!"
            description="Create a group and start planning together."
            ctaLabel="Add New Group"
            onCtaPress={() => {
              // TODO: Connect Add New Group to group creation flow
            }}
          />
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
                keyExtractor={(_, index) => index.toString()}
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
            <View style={styles.avatarPlaceholder} />
          </TouchableOpacity>
          <Text style={styles.greeting}>Hello, {userName}</Text>
        </View>

        <TouchableOpacity
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleSettingsPress}
          style={styles.settingsButton}
        >
          <Image contentFit="contain" source={settingsIcon} style={styles.settingsIcon} />
        </TouchableOpacity>
      </View>

      {/* Main heading */}
      <Text style={styles.heading}>
        Where do you{'\n'}want to explore today?
      </Text>

      {/* Map placeholder */}
      {/* TODO: Replace with real map component when maps integration is implemented */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>MAP PLACEHOLDER</Text>
      </View>

      {/* Search / destination field */}
      <View style={styles.searchContainer}>
        {/* TODO: Replace with final Figma location/search SVG */}
        <View style={styles.searchIconPlaceholder} />
        {/* TODO: Connect destination search to places/maps service */}
        <TextInput
          style={styles.searchInput}
          placeholder="Where do you want to go"
          placeholderTextColor={AutumnColors.body}
          editable={false}
          accessibilityLabel="Destination search"
        />
      </View>

      {/* Planner tabs */}
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
    gap: 7,
  },
  profileButton: {
    borderRadius: 9,
  },
  avatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AutumnColors.chipBorder,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  settingsButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 14,
    height: 14,
  },

  /* Heading */
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: AutumnColors.heading,
    lineHeight: 32,
    marginBottom: 16,
  },

  /* Map */
  mapPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#EDE9E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
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
    marginBottom: 14,
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

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  /* Content */
  contentArea: {
    flex: 1,
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

  /* Modal */
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
