import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@/lib/api';
import { signInWithSocialProvider, type SocialAuthProvider } from '@/lib/oauth';

const googleIcon = require('@/assets/images/Google_ic.svg');
const appleIcon = require('@/assets/images/Apple_ic.svg');
const emailIcon = require('@/assets/images/Email_ic.svg');
const lockIcon = require('@/assets/images/Lock_ic.svg');
const seeIcon = require('@/assets/images/See_ic.svg');
const unseeIcon = require('@/assets/images/Unsee_ic.svg');

const MINIMUM_PASSWORD_LENGTH = 8;

type SocialProvider = 'Google' | 'Apple';

export default function LoginScreen() {
  const passwordInputRef = useRef<TextInput>(null);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isPasswordAccepted =
    password.length >= MINIMUM_PASSWORD_LENGTH;

  const routeAfterLogin = async () => {
    const profile = await getMyProfile();
    router.replace(profile.onboarding_completed ? '/home' : '/preferences');
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(true);
    try {
      await signInWithSocialProvider(provider.toLowerCase() as SocialAuthProvider);
      await routeAfterLogin();
    } catch (error) {
      Alert.alert(
        `Unable to sign in with ${provider}`,
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || password.length < MINIMUM_PASSWORD_LENGTH) {
      Alert.alert(
        'Invalid login',
        'Please enter a valid email and password.',
      );
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsLoading(false);

    if (error) {
      Alert.alert('Unable to log in', error.message);
      return;
    }

    try {
      await routeAfterLogin();
    } catch (profileError) {
      Alert.alert(
        'Unable to load your profile',
        profileError instanceof Error ? profileError.message : 'Please try again.',
      );
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.content}>

        {/* HEADER */}
        <View
          style={[
            styles.intro,
            showEmailForm && styles.loginIntro,
          ]}
        >
          <Text
            style={[
              styles.title,
              showEmailForm && styles.loginTitle,
            ]}
          >
            {showEmailForm
              ? 'Log In To Your Account'
              : "Let's Get Started!"}
          </Text>

          <Text style={styles.subtitle}>
            {showEmailForm
              ? 'Welcome back! Please log in to your account\n'
                + 'to continue where you left off.'
              : "Welcome to your journey! We're thrilled to\n"
                + 'have you here.'}
          </Text>
        </View>

        {showEmailForm ? (
          /* =========================
             EMAIL LOGIN FORM
             ========================= */
          <View style={styles.emailForm}>

            {/* EMAIL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Email
              </Text>

              <View style={styles.inputContainer}>
                <Image
                  source={emailIcon}
                  contentFit="contain"
                  style={styles.icon}
                />

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#A4A7B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    passwordInputRef.current?.focus();
                  }}
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Password
              </Text>

              <View style={styles.inputContainer}>
                <Image
                  source={lockIcon}
                  contentFit="contain"
                  style={styles.icon}
                />

                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="password"
                  placeholderTextColor="#A4A7B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!isPasswordVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setIsPasswordVisible(
                      current => !current,
                    )
                  }
                >
                  <Image
                    source={
                      isPasswordVisible
                        ? seeIcon
                        : unseeIcon
                    }
                    contentFit="contain"
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>

              {isPasswordAccepted && (
                <View style={styles.passwordFeedback}>
                  <Text style={styles.accepted}>
                    ⊙ Password accepted!
                  </Text>

                  <Text style={styles.accepted}>
                    {Math.min(
                      password.length,
                      MINIMUM_PASSWORD_LENGTH,
                    )}
                    /{MINIMUM_PASSWORD_LENGTH}
                  </Text>
                </View>
              )}
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={handleLogin}
              style={[
                styles.loginButton,
                styles.formLoginButton,
                isLoading && styles.disabledButton,
              ]}
            >
              <Text style={styles.loginText}>
                {isLoading ? 'Logging In...' : 'Log In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don&apos;t have an account?
              </Text>

              <TouchableOpacity
                accessibilityLabel="Sign up"
                accessibilityRole="link"
                onPress={() => router.push('/Signup')}
              >
                <Text style={styles.signUpText}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              accessibilityLabel="Back to login options"
              accessibilityRole="button"
              onPress={() => setShowEmailForm(false)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>
                Back to login options
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* =========================
             SOCIAL LOGIN OPTIONS
             ========================= */
          <>
            <View style={styles.socialOptions}>

              <SocialButton
                icon={googleIcon}
                label="Continue With Google"
                onPress={() =>
                  void handleSocialLogin('Google')
                }
              />

              <SocialButton
                icon={appleIcon}
                label="Continue With Apple"
                onPress={() =>
                  void handleSocialLogin('Apple')
                }
              />

            </View>

            {/* DIVIDER */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />

              <Text style={styles.dividerText}>
                Or
              </Text>

              <View style={styles.dividerLine} />
            </View>

            {/* EMAIL LOGIN BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowEmailForm(true)}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>
                Log In
              </Text>
            </TouchableOpacity>

            {/* SIGN UP */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don&apos;t have an account?
              </Text>

              <TouchableOpacity
                accessibilityLabel="Sign up"
                accessibilityRole="link"
                onPress={() => router.push('/Signup')}
              >
                <Text style={styles.signUpText}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </View>
    </View>
  );
}

/* =========================
   SOCIAL BUTTON
   ========================= */

type SocialButtonProps = {
  icon: number;
  iconBackground?: string;
  label: string;
  onPress: () => void;
};

function SocialButton({
  icon,
  iconBackground,
  label,
  onPress,
}: SocialButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.socialButton}
    >
      <View
        style={[
          styles.socialIconFrame,
          iconBackground
            ? { backgroundColor: iconBackground }
            : null,
        ]}
      >
        <Image
          source={icon}
          contentFit="contain"
          style={styles.socialIcon}
        />
      </View>

      <Text style={styles.socialButtonText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================
   STYLES
   ========================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 25,
  },

  intro: {
    alignItems: 'center',
  },

  loginIntro: {
    marginTop: 121,
  },

  title: {
    color: '#08091D',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.25,
    lineHeight: 25,
    textAlign: 'center',
  },

  loginTitle: {
    fontSize: 22,
    lineHeight: 28,
  },

  subtitle: {
    marginTop: 12,
    color: '#16172D',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    textAlign: 'center',
  },

  /* =========================
     SOCIAL OPTIONS
     ========================= */

  socialOptions: {
    gap: 13,
    marginTop: 101,
  },

  socialButton: {
    height: 42,
    width: '100%',
    borderWidth: 1.25,
    borderColor: '#D1D3DC',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },

  socialIconFrame: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    overflow: 'hidden',
  },

  socialIcon: {
    width: 24,
    height: 24,
  },

  socialButtonText: {
    color: '#0A0B26',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },

  /* =========================
     DIVIDER
     ========================= */

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 38,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D7D8DF',
  },

  dividerText: {
    marginHorizontal: 14,
    color: '#8C8FA0',
    fontSize: 13,
    fontWeight: '500',
  },

  /* =========================
     LOGIN BUTTON
     ========================= */

  loginButton: {
    width: '100%',
    height: 42,
    marginTop: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4258C5',
    shadowColor: '#243DA9',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  formLoginButton: {
    marginTop: 26,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },

  /* =========================
     EMAIL FORM
     ========================= */

  emailForm: {
    marginTop: 39,
  },

  fieldGroup: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 7,
    color: '#15162B',
    fontSize: 13,
    fontWeight: '500',
  },

  inputContainer: {
    height: 44,
    width: '100%',
    borderWidth: 1.25,
    borderColor: '#B9BDCC',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 9,
  },

  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: '#08091D',
    fontSize: 13,
  },

  eyeButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyeIcon: {
    width: 20,
    height: 20,
  },

  passwordFeedback: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  accepted: {
    color: '#008E61',
    fontSize: 10,
    fontWeight: '600',
  },

  /* =========================
     FOOTER
     ========================= */

  footer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },

  footerText: {
    color: '#A8AABC',
    fontSize: 12,
    lineHeight: 16,
  },

  signUpText: {
    color: '#2538B7',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },

  backButton: {
    alignItems: 'center',
    marginTop: 18,
  },

  backButtonText: {
    color: '#5F6378',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
