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
import { usePreferences } from '@/contexts/PreferenceContext';
import { useSoloGoals, type SoloGoal } from '@/contexts/SoloGoalsContext';
import { PlannerTab } from '@/components/home/PlannerTab';
import { EmptyState } from '@/components/home/EmptyState';
import { TravelGoalCard } from '@/components/home/TravelGoalCard';
import { TravelGoalInput } from '@/components/home/TravelGoalInput';
import { PreferenceFilterChip } from '@/components/discovery/PreferenceFilterChip';
import { PlaceCard } from '@/components/discovery/PlaceCard';
import { DiscoveryBottomSheet } from '@/components/discovery/DiscoveryBottomSheet';
import { DiscoveryFilterPanel } from '@/components/discovery/DiscoveryFilterPanel';

type DiscoverySection = 'preferences' | 'itinerary' | 'goals';

/**
 * Mock place/recommendation data for layout testing.
 * Each place has a categoryId that maps to a preference ID for prototype filtering.
 * TODO: Replace mock recommendations with recommendation/maps API response.
 */
const MOCK_PLACES = [
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
    name: 'Name',
    location: 'Location',
    rating: 4.7,
    status: 'Status',
  },
  {
    id: '3',
    categoryId: 'food',
    category: 'Food & Culinary',
    name: 'Name',
    location: 'Location',
    rating: 4.7,
    status: 'Status',
  },
] as const;

export default function DiscoveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { destination } = useLocalSearchParams<{ destination?: string }>();
  const { selectedPreferences } = usePreferences();

  const [activeTab, setActiveTab] = useState<DiscoverySection>('preferences');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Active Discovery filters — initialized from user preferences but independent.
  // Toggling these does NOT modify the user's actual preference profile.
  // Using an array to preserve selection order for display ordering.
  const [activeFilterOrder, setActiveFilterOrder] = useState<string[]>(
    () => Array.from(selectedPreferences),
  );

  // Set view for O(1) lookup
  const activeFilters = useMemo(() => new Set(activeFilterOrder), [activeFilterOrder]);

  const toggleFilter = (id: string) => {
    setActiveFilterOrder((prev) => {
      if (prev.includes(id)) {
        // Deselect — remove from order
        return prev.filter((x) => x !== id);
      } else if (prev.length < 4) {
        // Select — append to end (preserves selection order)
        return [...prev, id];
      }
      // At max (4) and trying to add → no-op
      return prev;
    });
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

  // TODO: Replace local mock filtering with recommendation API filtering
  // TODO: Fetch recommendations using destination and active Discovery filters
  const filteredPlaces = useMemo(() => {
    if (activeFilters.size === 0) return MOCK_PLACES;
    return MOCK_PLACES.filter((place) => activeFilters.has(place.categoryId));
  }, [activeFilters]);

  // --- Solo Goals (shared with Home) ---
  const { goals, addGoal, removeGoal } = useSoloGoals();
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const handleAddGoal = useCallback((text: string) => {
    addGoal(text);
  }, [addGoal]);

  const handleLongPressGoal = useCallback((id: string) => {
    setGoalToDelete(id);
  }, []);

  const handleConfirmDeleteGoal = useCallback(() => {
    if (goalToDelete !== null) {
      removeGoal(goalToDelete);
      setGoalToDelete(null);
    }
  }, [goalToDelete, removeGoal]);

  const handleCancelDeleteGoal = useCallback(() => {
    setGoalToDelete(null);
  }, []);

  const renderGoalItem = useCallback(
    ({ item }: { item: SoloGoal }) => (
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
      {/* TODO: Replace with real interactive map */}
      <View style={[styles.mapArea, { paddingTop: insets.top + 12 }]}>
        {/* Back button + search bar overlaid on map */}
        <View style={[styles.mapOverlay, { top: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            {/* TODO: Replace with final Figma back-arrow SVG */}
            <View style={styles.backIconPlaceholder} />
          </TouchableOpacity>

          <View style={styles.searchPill}>
            {/* TODO: Resolve destination using Maps/Places API */}
            <TextInput
              style={styles.searchInput}
              value={destination ?? ''}
              editable={false}
              placeholder="Where do you want to go"
              placeholderTextColor={AutumnColors.body}
              accessibilityLabel="Destination"
            />
          </View>
        </View>

        <Text style={styles.mapPlaceholderText}>MAP PLACEHOLDER</Text>
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

        {/* Content based on active tab */}
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

            {/* Place cards */}
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
                    Try adjusting your filters to see more places.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {activeTab === 'itinerary' && (
          <View style={styles.emptySection}>
            {/* TODO: Connect Discovery itinerary to persisted itinerary data */}
            <Text style={styles.emptyTitle}>No plans yet!</Text>
            <Text style={styles.emptyDescription}>
              Save places to start building your trip.
            </Text>
          </View>
        )}

        {activeTab === 'goals' && (
          <View style={styles.goalsContainer}>
            <TravelGoalInput onAdd={handleAddGoal} />

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
                nestedScrollEnabled
                ItemSeparatorComponent={() => <View style={styles.goalSeparator} />}
              />
            )}
          </View>
        )}
      </DiscoveryBottomSheet>

      {/* Discovery Filter Panel Modal */}
      <DiscoveryFilterPanel
        visible={showFilterPanel}
        currentFilters={activeFilters}
        onApply={handleApplyFilters}
        onCancel={handleCancelFilterPanel}
      />

      {/* Clear Goal Confirmation Modal */}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.heading,
  },

  /* Map area */
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

  /* Preferences content */
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

  /* Empty sections */
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
