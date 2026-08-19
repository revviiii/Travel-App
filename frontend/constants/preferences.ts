/**
 * Shared travel preference categories used across the app.
 * Used by the Preferences screen, Discovery filters, and filter panel.
 *
 * Keep this as the single source of truth for preference category IDs and labels.
 */

export interface PreferenceCategory {
  id: string;
  label: string;
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'city', label: 'City Exploration' },
  { id: 'culture', label: 'Cultural & Heritage' },
  { id: 'beaches', label: 'Beaches' },
  { id: 'nature', label: 'Nature' },
  { id: 'roadtrips', label: 'Road Trips' },
  { id: 'food', label: 'Food & Culinary' },
  { id: 'gym', label: 'Gym' },
  { id: 'bar', label: 'Bar' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'skiing', label: 'Skiing/Snowboarding' },
  { id: 'retreats', label: 'Retreats' },
  { id: 'spa', label: 'SPA' },
];

export const PROFILE_TRAVEL_PREFERENCES: PreferenceCategory[] = [
  { id: 'adventure', label: 'Adventure Travel' },
  { id: 'city-breaks', label: 'City Breaks' },
  { id: 'cultural-exploration', label: 'Cultural Exploration' },
  { id: 'wine', label: 'Wine Tours' },
  { id: 'beach-vacations', label: 'Beach Vacations' },
  { id: 'nature-escapes', label: 'Nature Escapes' },
  { id: 'road-trips', label: 'Road Trips' },
  { id: 'food-tourism', label: 'Food Tourism' },
  { id: 'historical-sites', label: 'Historical Sites' },
  { id: 'music-festivals', label: 'Music Festivals' },
  { id: 'art-gallery', label: 'Art Gallery' },
  { id: 'culinary-tours', label: 'Culinary Tours' },
  { id: 'group-tours', label: 'Group Tours' },
  { id: 'skiing-snowboarding', label: 'Skiing/Snowboarding' },
  { id: 'retreats-profile', label: 'Retreats' },
  { id: 'water-activity', label: 'Water Activity' },
  { id: 'bus-hop-on-hop', label: 'Bus Hop On Hop' },
  { id: 'cruise-vacations', label: 'Cruise Vacations' },
  { id: 'solo-travel', label: 'Solo Travel' },
  { id: 'eco-tourism', label: 'Eco-Tourism' },
  { id: 'spa-getaways', label: 'Spa Getaways' },
  { id: 'desert-adventures', label: 'Desert Adventures' },
  { id: 'fishing-tour', label: 'Fishing Tour' },
];

/**
 * Lookup map for quick ID → label resolution.
 */
export const PREFERENCE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  [...PREFERENCE_CATEGORIES, ...PROFILE_TRAVEL_PREFERENCES].map((cat) => [cat.id, cat.label]),
);
