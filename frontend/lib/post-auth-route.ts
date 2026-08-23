import { getMyProfile } from '@/lib/api';

export type PostAuthRoute = '/home' | '/preferences';

/**
 * Determine post-authentication routing based solely on onboarding completion.
 * An onboarded user with zero profile preferences is valid and routes to /home.
 * Only genuinely incomplete onboarding routes to /preferences.
 */
export async function getPostAuthRoute(): Promise<PostAuthRoute> {
  const profile = await getMyProfile();

  return profile.onboarding_completed ? '/home' : '/preferences';
}
