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

/** Profile editing and onboarding intentionally present the same choices. */
export const PROFILE_TRAVEL_PREFERENCES: PreferenceCategory[] = PREFERENCE_CATEGORIES;

/**
 * Older app builds stored a second set of profile-only IDs. Convert them to the
 * canonical IDs accepted by the Google Places API before displaying or using them.
 */
export const LEGACY_PREFERENCE_ID_MAP: Record<string, string> = {
  adventure: 'outdoors',
  'city-breaks': 'city',
  'cultural-exploration': 'culture',
  wine: 'food',
  'beach-vacations': 'beaches',
  'nature-escapes': 'nature',
  'road-trips': 'roadtrips',
  'food-tourism': 'food',
  'historical-sites': 'culture',
  'music-festivals': 'culture',
  'art-gallery': 'culture',
  'culinary-tours': 'food',
  'group-tours': 'city',
  'skiing-snowboarding': 'skiing',
  'retreats-profile': 'retreats',
  'water-activity': 'beaches',
  'bus-hop-on-hop': 'city',
  'cruise-vacations': 'beaches',
  'solo-travel': 'city',
  'eco-tourism': 'nature',
  'spa-getaways': 'spa',
  'desert-adventures': 'outdoors',
  'fishing-tour': 'outdoors',
};

const CANONICAL_PREFERENCE_IDS = new Set(PREFERENCE_CATEGORIES.map((item) => item.id));

export function normalizePreferenceIds(values: Iterable<string>): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const canonical = LEGACY_PREFERENCE_ID_MAP[value] ?? value;
    if (CANONICAL_PREFERENCE_IDS.has(canonical) && !seen.has(canonical)) {
      normalized.push(canonical);
      seen.add(canonical);
    }
  }

  return normalized;
}

/**
 * Lookup map for quick ID → label resolution.
 */
export const PREFERENCE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  [
    ...PREFERENCE_CATEGORIES.map((category) => [category.id, category.label]),
    ...Object.entries(LEGACY_PREFERENCE_ID_MAP).map(([legacyId, canonicalId]) => [
      legacyId,
      PREFERENCE_CATEGORIES.find((category) => category.id === canonicalId)?.label ?? legacyId,
    ]),
  ],
);
