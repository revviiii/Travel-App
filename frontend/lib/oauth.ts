import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type SocialAuthProvider = 'google' | 'apple';

WebBrowser.maybeCompleteAuthSession();

export const socialAuthRedirectUrl = makeRedirectUri({
  scheme: 'frontend',
  path: 'auth/callback',
});

export async function createSessionFromUrl(url: string): Promise<Session> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  const providerError = params.error_description ?? params.error;

  if (errorCode || providerError) {
    const message = String(providerError ?? errorCode);
    let decodedMessage = message;
    try {
      decodedMessage = decodeURIComponent(message);
    } catch {
      // Keep the provider message as-is when it contains invalid percent escapes.
    }
    throw new Error(decodedMessage);
  }

  const code = params.code;
  if (typeof code === 'string' && code.length > 0) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    if (!data.session) throw new Error('Pinara could not create your sign-in session.');
    return data.session;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    throw new Error('Pinara did not receive a complete sign-in session.');
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  if (!data.session) throw new Error('Pinara could not save your sign-in session.');
  return data.session;
}

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

  await createSessionFromUrl(browserResult.url);
}
