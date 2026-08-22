import { getMyPreferences, getMyProfile } from '@/lib/api';

export type PostAuthRoute = '/home' | '/preferences';

/**
 * Keep every authentication entry point on the same onboarding path.
 * A user reaches the dashboard only after saving at least one preference.
 */
export async function getPostAuthRoute(): Promise<PostAuthRoute> {
  const [profile, preferences] = await Promise.all([
    getMyProfile(),
    getMyPreferences(),
  ]);

  return profile.onboarding_completed && preferences.length > 0
    ? '/home'
    : '/preferences';
}
