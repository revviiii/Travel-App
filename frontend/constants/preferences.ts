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

/**
 * Lookup map for quick ID → label resolution.
 */
export const PREFERENCE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PREFERENCE_CATEGORIES.map((cat) => [cat.id, cat.label]),
);
