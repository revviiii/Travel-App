import { useState } from 'react';
import {
  FlatList,
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
import { PlannerTab } from '@/components/home/PlannerTab';
import { PreferenceFilterChip } from '@/components/discovery/PreferenceFilterChip';
import { PlaceCard } from '@/components/discovery/PlaceCard';

type DiscoverySection = 'preferences' | 'itinerary' | 'goals';

/**
 * Mock preference filter data.
 * TODO: Replace with persisted user preferences from the Preferences screen / backend.
 */
const MOCK_FILTERS = [
  { id: 'adventure', label: 'Adventure Travel' },
  { id: 'historical', label: 'Historical Sites' },
  { id: 'cafe', label: 'Cafe' },
] as const;

/**
 * Mock place/recommendation data for layout testing.
 * TODO: Replace mock recommendations with backend/maps API data.
 */
const MOCK_PLACES = [
  {
    id: '1',
    category: 'Adventure Travel',
    name: 'Uffizi Gallery',
    location: 'Location',
    rating: 4.7,
    status: 'Open \u00B7 Mon-Thu: 10:00 AM\u20139:00 PM',
  },
  {
    id: '2',
    category: 'Historical Sites',
    name: 'Name',
    location: 'Location',
    rating: 4.7,
    status: 'Status',
  },
  {
    id: '3',
    category: 'Cafe',
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

  const [activeTab, setActiveTab] = useState<DiscoverySection>('preferences');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['adventure']));

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.screen}>
      {/* Map area placeholder */}
      {/* TODO: Replace with real interactive map */}
      <View style={[styles.mapArea, { paddingTop: insets.top + 12 }]}>
        {/* Back button + search bar overlaid on map */}
        <View style={styles.mapOverlay}>
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
            {/* TODO: Connect destination search to Places/Maps API */}
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

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
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
            {/* Filter row */}
            <View style={styles.filterRow}>
              {/* TODO: Replace with final Figma filter SVG */}
              <View style={styles.filterIconPlaceholder} />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChips}
              >
                {MOCK_FILTERS.map((filter) => (
                  <PreferenceFilterChip
                    key={filter.id}
                    label={filter.label}
                    active={activeFilters.has(filter.id)}
                    onPress={() => toggleFilter(filter.id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Place cards */}
            <FlatList
              data={MOCK_PLACES}
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
              ItemSeparatorComponent={() => <View style={styles.placeSeparator} />}
            />
          </View>
        )}

        {activeTab === 'itinerary' && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyTitle}>No plans yet!</Text>
            <Text style={styles.emptyDescription}>
              Start exploring destinations and add places to your itinerary.
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AutumnColors.heading,
  },

  /* Map area */
  mapArea: {
    flex: 1,
    minHeight: '45%',
    backgroundColor: '#3A5A40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
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

  /* Bottom panel */
  bottomPanel: {
    backgroundColor: AutumnColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: '55%',
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
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filterIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
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

  /* Empty sections */
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
  },
});
