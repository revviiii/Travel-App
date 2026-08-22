import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

export type SocialAuthProvider = 'google' | 'facebook' | 'apple';

WebBrowser.maybeCompleteAuthSession();

export const socialAuthRedirectUrl = makeRedirectUri({
  scheme: 'frontend',
  path: 'auth/callback',
});

export async function signInWithSocialProvider(
  provider: SocialAuthProvider,
): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: socialAuthRedirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error(`${provider} did not return a sign-in URL.`);

  const browserResult = await WebBrowser.openAuthSessionAsync(
    data.url,
    socialAuthRedirectUrl,
  );
  if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
    throw new Error('Sign in was cancelled.');
  }
  if (browserResult.type !== 'success') {
    throw new Error('The sign-in window did not complete successfully.');
  }

  const { params, errorCode } = QueryParams.getQueryParams(browserResult.url);
  if (errorCode) {
    throw new Error(String(params.error_description ?? errorCode));
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw new Error('The provider returned an incomplete Supabase session.');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}
