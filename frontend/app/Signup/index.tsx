import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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

const userIcon = require('@/assets/images/User_ic.svg');
const emailIcon = require('@/assets/images/Email_ic.svg');
const lockIcon = require('@/assets/images/Lock_ic.svg');
const seeIcon = require('@/assets/images/See_ic.svg');
const unseeIcon = require('@/assets/images/Unsee_ic.svg');
const googleIcon = require('@/assets/images/Google_ic.svg');
const facebookIcon = require('@/assets/images/Facebook_ic.svg');
const appleIcon = require('@/assets/images/Apple_ic.svg');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 8;

type FieldName = 'fullName' | 'email' | 'password';
type FormErrors = Partial<Record<FieldName, string>>;
type SocialProvider = 'Google' | 'Facebook' | 'Apple';

export default function SignupScreen() {
  const router = useRouter();

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (
    field: FieldName,
    value: string,
  ) => {
    if (field === 'fullName') {
      setFullName(value);
    }

    if (field === 'email') {
      setEmail(value);
    }

    if (field === 'password') {
      setPassword(value);
    }

    if (errors[field]) {
      setErrors(current => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName =
        'Enter your full name.';
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email =
        'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password =
        'Enter a password.';
    } else if (
      password.length < MINIMUM_PASSWORD_LENGTH
    ) {
      nextErrors.password =
        `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = () => {
    if (validateForm()) {
      Alert.alert(
        'Account ready',
        'Your sign-up details are valid.',
      );
    }
  };

  const handleSocialSignup = (
    provider: SocialProvider,
  ) => {
    Alert.alert(
      `${provider} sign up`,
      `${provider} authentication will be connected here.`,
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.content}>

        {/* HEADER */}
        <View style={styles.intro}>
          <Text style={styles.title}>
            Create Your Account
          </Text>

          <Text style={styles.subtitle}>
            Please fill in your details to create your
            {'\n'}
            account and enjoy our services.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>

          {/* FULL NAME */}
          <FormField
            error={errors.fullName}
            icon={userIcon}
            label="Full Name"
          >
            <TextInput
              accessibilityLabel="Full name"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              onChangeText={value =>
                updateField('fullName', value)
              }
              onSubmitEditing={() =>
                emailInputRef.current?.focus()
              }
              placeholder="Full Name"
              placeholderTextColor="#A5A8B9"
              returnKeyType="next"
              style={styles.input}
              value={fullName}
            />
          </FormField>

          {/* EMAIL */}
          <FormField
            error={errors.email}
            icon={emailIcon}
            label="Email"
          >
            <TextInput
              ref={emailInputRef}
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={value =>
                updateField('email', value)
              }
              onSubmitEditing={() =>
                passwordInputRef.current?.focus()
              }
              placeholder="Email"
              placeholderTextColor="#A5A8B9"
              returnKeyType="next"
              style={styles.input}
              value={email}
            />
          </FormField>

          {/* PASSWORD */}
          <FormField
            error={errors.password}
            icon={lockIcon}
            label="Password"
          >
            <TextInput
              ref={passwordInputRef}
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              onChangeText={value =>
                updateField('password', value)
              }
              onSubmitEditing={handleSignup}
              placeholder="password"
              placeholderTextColor="#A5A8B9"
              returnKeyType="done"
              secureTextEntry={!isPasswordVisible}
              style={styles.input}
              value={password}
            />

            <TouchableOpacity
              accessibilityLabel={
                isPasswordVisible
                  ? 'Hide password'
                  : 'Show password'
              }
              accessibilityRole="button"
              hitSlop={10}
              onPress={() =>
                setIsPasswordVisible(
                  visible => !visible,
                )
              }
              style={styles.visibilityButton}
            >
              <Image
                contentFit="contain"
                source={
                  isPasswordVisible
                    ? seeIcon
                    : unseeIcon
                }
                style={styles.visibilityIcon}
              />
            </TouchableOpacity>
          </FormField>

          {/* SIGN UP BUTTON */}
          <TouchableOpacity
            accessibilityLabel="Sign up"
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={handleSignup}
            style={styles.signupButton}
          >
            <Text style={styles.signupButtonText}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* DIVIDER */}
        <View
          style={styles.divider}
          accessibilityRole="text"
        >
          <View style={styles.dividerLine} />

          <Text style={styles.dividerText}>
            Or
          </Text>

          <View style={styles.dividerLine} />
        </View>

        {/* SOCIAL LOGIN */}
        <View style={styles.socialRow}>
          <SocialButton
            icon={googleIcon}
            label="Sign up with Google"
            onPress={() =>
              handleSocialSignup('Google')
            }
          />

          <SocialButton
            icon={facebookIcon}
            iconBackground="#1877F2"
            label="Sign up with Facebook"
            onPress={() =>
              handleSocialSignup('Facebook')
            }
          />

          <SocialButton
            icon={appleIcon}
            label="Sign up with Apple"
            onPress={() =>
              handleSocialSignup('Apple')
            }
          />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            accessibilityLabel="Log in"
            accessibilityRole="link"
            hitSlop={8}
            onPress={() =>
              router.replace('/Login')
            }
          >
            <Text style={styles.loginLink}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

/* =========================
   FORM FIELD
   ========================= */

type FormFieldProps = {
  children: React.ReactNode;
  error?: string;
  icon: number;
  label: string;
};

function FormField({
  children,
  error,
  icon,
  label,
}: FormFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
        ]}
      >
        <Image
          contentFit="contain"
          source={icon}
          style={styles.fieldIcon}
        />

        {children}
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}
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
      accessibilityLabel={label}
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.socialButton}
    >
      <View
        style={[
          styles.socialIconFrame,
          iconBackground
            ? {
                backgroundColor:
                  iconBackground,
              }
            : null,
        ]}
      >
        <Image
          contentFit="contain"
          source={icon}
          style={styles.socialIcon}
        />
      </View>
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
    paddingHorizontal: 31,
    paddingTop: 58,
  },

  intro: {
    alignItems: 'center',
  },

  title: {
    color: '#08091D',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.25,
    lineHeight: 25,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 11,
    color: '#16172D',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },

  form: {
    marginTop: 35,
  },

  fieldGroup: {
    marginBottom: 13,
  },

  label: {
    marginBottom: 6,
    color: '#101127',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },

  inputContainer: {
    width: '100%',
    height: 40,
    borderWidth: 1.15,
    borderColor: '#B9BDCC',
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  inputError: {
    borderColor: '#D9344C',
  },

  fieldIcon: {
    width: 17,
    height: 17,
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: '#08091D',
    fontSize: 11,
  },

  visibilityButton: {
    width: 28,
    height: 34,
    marginRight: -7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  visibilityIcon: {
    width: 17,
    height: 17,
  },

  errorText: {
    marginTop: 3,
    marginLeft: 3,
    marginBottom: -7,
    color: '#C52A40',
    fontSize: 9,
    lineHeight: 11,
  },

  signupButton: {
    width: '100%',
    height: 40,
    marginTop: 11,
    borderRadius: 13,
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

  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },

  divider: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D5D7E0',
  },

  dividerText: {
    marginHorizontal: 14,
    color: '#9295A7',
    fontSize: 11,
    fontWeight: '500',
  },

  socialRow: {
    marginTop: 31,
    flexDirection: 'row',
    gap: 13,
  },

  socialButton: {
    flex: 1,
    height: 37,
    borderWidth: 1.15,
    borderColor: '#D1D3DC',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  socialIconFrame: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  socialIcon: {
    width: 20,
    height: 20,
  },

  footer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  footerText: {
    color: '#A8AABC',
    fontSize: 10,
    lineHeight: 14,
  },

  loginLink: {
    color: '#2538B7',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});