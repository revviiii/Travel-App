import { useState, useMemo, useCallback } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { PREFERENCE_CATEGORIES } from '@/constants/preferences';
import { useGroupGoals, type GroupGoal } from '@/contexts/GroupGoalsContext';
import { useGroupItinerary, type GroupItineraryItem } from '@/contexts/GroupItineraryContext';
import { PlannerTab } from '@/components/home/PlannerTab';
import { EmptyState } from '@/components/home/EmptyState';
import { TravelGoalCard } from '@/components/home/TravelGoalCard';
import { TravelGoalInput } from '@/components/home/TravelGoalInput';
import { PreferenceFilterChip } from '@/components/discovery/PreferenceFilterChip';
import { PlaceCard } from '@/components/discovery/PlaceCard';
import { DiscoveryBottomSheet } from '@/components/discovery/DiscoveryBottomSheet';
import { DiscoveryFilterPanel } from '@/components/discovery/DiscoveryFilterPanel';
import { GroupSchedulePanel } from '@/components/group/itinerary/GroupSchedulePanel';
import { GroupTimeline } from '@/components/group/itinerary/GroupTimeline';
import { GroupVoteActions } from '@/components/group/itinerary/GroupVoteActions';

type DiscoverySection = 'preferences' | 'itinerary' | 'goals';

interface PlaceInfo {
  id: string;
  categoryId: string;
  category: string;
  name: string;
  location: string;
  rating: number;
  status: string;
}

/**
 * Mock place data for Group Discovery layout testing.
 * TODO: Replace mock recommendations with backend/maps API response
 * TODO: Replace with Group Discovery map/API integration
 * TODO: Resolve group recommendation preferences from member profiles
 */
const MOCK_GROUP_PLACES: PlaceInfo[] = [
  {
    id: '1',
    categoryId: 'culture',
    category: 'Cultural & Heritage',
    name: 'Uffizi Gallery',
    location: 'Location Details',
    rating: 4.7,
    status: 'Open \u00B7 Mon-Thu: 10:00 AM\u20139:00 PM',
  },
  {
    id: '2',
    categoryId: 'outdoors',
    category: 'Outdoors',
    name: 'Mountain Trail',
    location: 'Location',
    rating: 4.5,
    status: 'Open',
  },
  {
    id: '3',
    categoryId: 'food',
    category: 'Food & Culinary',
    name: 'Local Bistro',
    location: 'City Center',
    rating: 4.3,
    status: 'Open',
  },
];

export default function GroupDiscoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { getGoals, addGoal, removeGoal } = useGroupGoals();
  const { getItems, addItem, castVote } = useGroupItinerary();

  const [activeTab, setActiveTab] = useState<DiscoverySection>('preferences');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Group Discovery filters — independent from Solo Discovery and PreferenceContext
  // TODO: Resolve Group Discovery preferences from group member preference data
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Scheduling panel state
  const [schedulePlace, setSchedulePlace] = useState<PlaceInfo | null>(null);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);

  // Voting state
  const [votingItemId, setVotingItemId] = useState<string | null>(null);

  // Group Goals — scoped to this groupId, completely separate from Solo Goals
  const goals = getGoals(groupId ?? '');
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // Group Itinerary — scoped to this groupId
  const itineraryItems = getItems(groupId ?? '');
  const votingItem = votingItemId
    ? itineraryItems.find((i) => i.id === votingItemId) ?? null
    : null;

  // --- Filters ---
  const toggleFilter = useCallback((id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleApplyFilters = useCallback((filters: Set<string>) => {
    setActiveFilters(filters);
    setShowFilterPanel(false);
  }, []);

  // Ordered categories: active first, then inactive
  const orderedCategories = useMemo(() => {
    const activeArr = Array.from(activeFilters);
    const active = activeArr
      .map((id) => PREFERENCE_CATEGORIES.find((c) => c.id === id))
      .filter(Boolean) as typeof PREFERENCE_CATEGORIES;
    const inactive = PREFERENCE_CATEGORIES.filter((c) => !activeFilters.has(c.id));
    return [...active, ...inactive];
  }, [activeFilters]);

  // TODO: Fetch recommendations using destination, group preferences, and active filters
  const filteredPlaces = useMemo(() => {
    if (activeFilters.size === 0) return MOCK_GROUP_PLACES;
    return MOCK_GROUP_PLACES.filter((p) => activeFilters.has(p.categoryId));
  }, [activeFilters]);

  // --- Scheduling ---
  const handleAddToItinerary = useCallback((place: PlaceInfo) => {
    setSchedulePlace(place);
    setShowSchedulePanel(true);
  }, []);

  const handleScheduleClose = useCallback(() => {
    setShowSchedulePanel(false);
    setSchedulePlace(null);
  }, []);

  const handleScheduleAdd = useCallback(
    (data: { date: string; time: string; votingEnabled: boolean }) => {
      if (!schedulePlace || !groupId) return;
      addItem({
        groupId,
        placeName: schedulePlace.name,
        placeCategory: schedulePlace.category,
        placeLocation: schedulePlace.location,
        date: data.date,
        time: data.time,
        votingEnabled: data.votingEnabled,
        votingStatus: data.votingEnabled ? 'voting' : 'confirmed',
        votes: { interested: 0, pass: 0 },
        currentUserVote: null,
      });
      setShowSchedulePanel(false);
      setSchedulePlace(null);
    },
    [schedulePlace, groupId, addItem],
  );

  // --- Voting ---
  const handleLongPressItineraryItem = useCallback((itemId: string) => {
    setVotingItemId(itemId);
  }, []);

  const handleCastVote = useCallback(
    (vote: 'interested' | 'pass') => {
      if (votingItemId && groupId) {
        castVote(groupId, votingItemId, vote);
      }
      setVotingItemId(null);
    },
    [votingItemId, groupId, castVote],
  );

  const handleCloseVoting = useCallback(() => {
    setVotingItemId(null);
  }, []);

  // --- Goals ---
  const handleAddGoal = useCallback(
    (text: string) => {
      if (groupId) addGoal(groupId, text);
    },
    [groupId, addGoal],
  );

  const handleLongPressGoal = useCallback((goalId: string) => {
    setGoalToDelete(goalId);
  }, []);

  const handleConfirmDeleteGoal = useCallback(() => {
    if (goalToDelete && groupId) {
      removeGoal(groupId, goalToDelete);
      setGoalToDelete(null);
    }
  }, [goalToDelete, groupId, removeGoal]);

  const handleCancelDeleteGoal = useCallback(() => {
    setGoalToDelete(null);
  }, []);

  const renderGoalItem = useCallback(
    ({ item }: { item: GroupGoal }) => (
      <TravelGoalCard text={item.text} onLongPress={() => handleLongPressGoal(item.id)} />
    ),
    [handleLongPressGoal],
  );

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.screen}>
      {/* Map area placeholder */}
      {/* TODO: Replace placeholder with interactive map and map gestures */}
      <View style={[styles.mapArea, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.mapOverlay, { top: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            {/* TODO: Replace with final Figma Back arrow SVG */}
            <View style={styles.backIconPlaceholder} />
          </TouchableOpacity>

          <View style={styles.searchPill}>
            <TextInput
              style={styles.searchInput}
              value=""
              editable={false}
              placeholder="Search for group places"
              placeholderTextColor={AutumnColors.body}
              accessibilityLabel="Group destination search"
            />
          </View>
        </View>

        <Text style={styles.mapPlaceholderText}>GROUP MAP PLACEHOLDER</Text>
      </View>

      {/* Draggable bottom sheet */}
      <DiscoveryBottomSheet>
        {/* Navigation tabs */}
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

        {/* Preferences tab */}
        {activeTab === 'preferences' && (
          <View style={styles.preferencesContent}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setShowFilterPanel(true)}
                accessibilityRole="button"
                accessibilityLabel="Open filter selection"
                style={styles.filterButton}
              >
                {/* TODO: Replace with final Figma filter SVG icon */}
                <View style={styles.filterIconPlaceholder} />
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
              data={filteredPlaces}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PlaceCard
                  category={item.category}
                  name={item.name}
                  location={item.location}
                  rating={item.rating}
                  status={item.status}
                  onAddToItinerary={() => handleAddToItinerary(item)}
                />
              )}
              contentContainerStyle={styles.placeList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              ItemSeparatorComponent={() => <View style={styles.placeSeparator} />}
              ListEmptyComponent={
                <View style={styles.emptySection}>
                  <Text style={styles.emptyTitle}>No matches</Text>
                  <Text style={styles.emptyDescription}>
                    Adjust filters to see group recommendations.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* Itinerary tab */}
        {activeTab === 'itinerary' && (
          <View style={styles.itineraryContainer}>
            {itineraryItems.length === 0 ? (
              <EmptyState
                title="No group plans yet!"
                description="Save places to build your group itinerary."
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={styles.itineraryScroll}
                style={styles.itineraryList}
              >
                <GroupTimeline
                  items={itineraryItems}
                  onLongPressItem={handleLongPressItineraryItem}
                />
              </ScrollView>
            )}

            {/* Sync to Calendar — stable bottom position */}
            <View style={styles.calendarArea}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Sync to Calendar"
                style={styles.calendarButton}
              >
                {/* TODO: Implement calendar integration */}
                <Text style={styles.calendarText}>Sync to Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Goals tab — uses GroupGoalsContext, NOT SoloGoalsContext */}
        {activeTab === 'goals' && (
          <View style={styles.goalsContainer}>
            <TravelGoalInput onAdd={handleAddGoal} />

            {goals.length === 0 ? (
              <EmptyState
                title="No group goals yet!"
                description="Add a goal for your group adventure."
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

      {/* Schedule Panel */}
      <GroupSchedulePanel
        visible={showSchedulePanel}
        place={schedulePlace}
        onClose={handleScheduleClose}
        onAdd={handleScheduleAdd}
      />

      {/* Filter Panel */}
      <DiscoveryFilterPanel
        visible={showFilterPanel}
        currentFilters={activeFilters}
        onApply={handleApplyFilters}
        onCancel={() => setShowFilterPanel(false)}
      />

      {/* Vote Actions */}
      <GroupVoteActions
        visible={votingItemId !== null}
        placeName={votingItem?.placeName ?? ''}
        currentVote={votingItem?.currentUserVote ?? null}
        onVote={handleCastVote}
        onClose={handleCloseVoting}
      />

      {/* Clear Group Goal Confirmation Modal */}
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
              This will remove the selected group travel goal.
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.heading,
  },

  /* Map */
  mapArea: {
    flex: 1,
    backgroundColor: '#3A5A40',
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
    zIndex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
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
  mapPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },

  /* Preferences */
  preferencesContent: {
    flexShrink: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  filterIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
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

  /* Itinerary */
  itineraryContainer: {
    flexShrink: 1,
  },
  itineraryList: {
    maxHeight: 280,
  },
  itineraryScroll: {
    paddingBottom: 8,
  },
  calendarArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  calendarButton: {
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  calendarText: {
    fontSize: 13,
    fontWeight: '500',
    color: AutumnColors.chipText,
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

  /* Empty */
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
