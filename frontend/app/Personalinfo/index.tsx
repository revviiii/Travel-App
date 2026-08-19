import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const emailIcon = require('@/assets/images/Email_ic.svg');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COUNTRY_CODES = [
  { flag: '🇪🇸', label: 'Spain', prefix: '+34' },
  { flag: '🇬🇧', label: 'United Kingdom', prefix: '+44' },
  { flag: '🇺🇸', label: 'United States', prefix: '+1' },
];
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

type FormField = 'fullName' | 'email' | 'country' | 'phone' | 'gender';
type FormErrors = Partial<Record<FormField, string>>;
type CountryCode = (typeof COUNTRY_CODES)[number];

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const emailRef = useRef<TextInput>(null);
  const countryRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [genderPickerOpen, setGenderPickerOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateValue = (field: FormField, update: () => void) => {
    update();
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/Userprofile');
  };

  const handleSave = () => {
    const nextErrors: FormErrors = {};
    if (!fullName.trim()) nextErrors.fullName = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email.';
    if (!country.trim()) nextErrors.country = 'Enter your country.';
    if (!phone.trim()) nextErrors.phone = 'Enter your phone number.';
    if (!gender) nextErrors.gender = 'Select your gender.';
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      Alert.alert('Profile saved', 'Your personal information has been updated.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleBack}
          style={({ pressed }) => [styles.headerControl, pressed && styles.pressed]}
        >
          <Ionicons color="#17192E" name="arrow-back" size={19} />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Info</Text>
        <View style={styles.headerControl} />
      </View>

      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.form}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.formScroll}
      >
        <InputField error={errors.fullName} label="Full Name">
          <TextInput
            accessibilityLabel="Full name"
            autoCapitalize="words"
            autoComplete="name"
            onChangeText={(value) => updateValue('fullName', () => setFullName(value))}
            onSubmitEditing={() => emailRef.current?.focus()}
            placeholder="Name here"
            placeholderTextColor="#A7AABB"
            returnKeyType="next"
            style={styles.textInput}
            value={fullName}
          />
        </InputField>

        <InputField error={errors.email} label="Email">
          <Image contentFit="contain" source={emailIcon} style={styles.leadingSvg} />
          <TextInput
            ref={emailRef}
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
            onChangeText={(value) => updateValue('email', () => setEmail(value))}
            onSubmitEditing={() => countryRef.current?.focus()}
            placeholder="user@email.com"
            placeholderTextColor="#A7AABB"
            returnKeyType="next"
            style={styles.textInput}
            value={email}
          />
        </InputField>

        <InputField error={errors.country} label="Country">
          <MaterialCommunityIcons color="#5B6075" name="map-marker-outline" size={17} />
          <TextInput
            ref={countryRef}
            accessibilityLabel="Country"
            autoCapitalize="words"
            autoComplete="country"
            onChangeText={(value) => updateValue('country', () => setCountry(value))}
            onSubmitEditing={() => phoneRef.current?.focus()}
            placeholder="Location"
            placeholderTextColor="#A7AABB"
            returnKeyType="next"
            style={[styles.textInput, styles.inputAfterIcon]}
            value={country}
          />
        </InputField>

        <InputField error={errors.phone} label="Phone Number">
          <Pressable
            accessibilityLabel={`Country code ${countryCode.prefix}`}
            accessibilityRole="button"
            onPress={() => setCountryPickerOpen(true)}
            style={({ pressed }) => [styles.countryCode, pressed && styles.pressed]}
          >
            <Text style={styles.flag}>{countryCode.flag}</Text>
            <Text style={styles.prefix}>{countryCode.prefix}</Text>
          </Pressable>
          <View style={styles.phoneDivider} />
          <TextInput
            ref={phoneRef}
            accessibilityLabel="Phone number"
            autoComplete="tel"
            inputMode="tel"
            onChangeText={(value) => updateValue('phone', () => setPhone(value))}
            placeholder="000 000 000"
            placeholderTextColor="#A7AABB"
            returnKeyType="done"
            style={[styles.textInput, styles.phoneInput]}
            value={phone}
          />
        </InputField>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gender</Text>
          <Pressable
            accessibilityLabel="Select gender"
            accessibilityRole="button"
            onPress={() => setGenderPickerOpen(true)}
            style={({ pressed }) => [
              styles.inputContainer,
              errors.gender && styles.inputError,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons color="#7C8093" name="chevron-down" size={14} />
            <Text style={[styles.selectText, gender && styles.selectValue]}>
              {gender || 'Select..'}
            </Text>
            <Ionicons color="#8C90A2" name="chevron-down" size={14} />
          </Pressable>
          {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom + 18, 26) }]}>
        <Pressable
          accessibilityLabel="Save personal information"
          accessibilityRole="button"
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, pressed && styles.savePressed]}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <OptionModal
        onClose={() => setCountryPickerOpen(false)}
        title="Country code"
        visible={countryPickerOpen}
      >
        {COUNTRY_CODES.map((item) => (
          <Pressable
            key={item.prefix}
            accessibilityRole="button"
            onPress={() => {
              setCountryCode(item);
              setCountryPickerOpen(false);
            }}
            style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
          >
            <Text style={styles.optionFlag}>{item.flag}</Text>
            <Text style={styles.optionLabel}>{item.label}</Text>
            <Text style={styles.optionPrefix}>{item.prefix}</Text>
          </Pressable>
        ))}
      </OptionModal>

      <OptionModal
        onClose={() => setGenderPickerOpen(false)}
        title="Select gender"
        visible={genderPickerOpen}
      >
        {GENDERS.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            onPress={() => {
              updateValue('gender', () => setGender(item));
              setGenderPickerOpen(false);
            }}
            style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
          >
            <Text style={styles.optionLabel}>{item}</Text>
            {gender === item ? <Ionicons color="#4258C5" name="checkmark" size={18} /> : null}
          </Pressable>
        ))}
      </OptionModal>
    </KeyboardAvoidingView>
  );
}

type InputFieldProps = {
  children: React.ReactNode;
  error?: string;
  label: string;
};

function InputField({ children, error, label }: InputFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>{children}</View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type OptionModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
};

function OptionModal({ children, onClose, title, visible }: OptionModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.modalOverlay}>
        <Pressable style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerControl: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#12236E',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  formScroll: {
    flex: 1,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingTop: 16,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 7,
    color: '#17192E',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
  },
  inputContainer: {
    width: '100%',
    height: 48,
    borderWidth: 1.1,
    borderColor: '#B8BDCC',
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#C83A45',
  },
  textInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: '#17192E',
    fontSize: 13,
  },
  leadingSvg: {
    width: 17,
    height: 17,
    marginRight: 9,
  },
  inputAfterIcon: {
    marginLeft: 9,
  },
  countryCode: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 16,
    lineHeight: 20,
  },
  prefix: {
    color: '#969AAD',
    fontSize: 12,
  },
  phoneDivider: {
    width: 1,
    height: 21,
    marginLeft: 9,
    backgroundColor: '#D8DAE2',
  },
  phoneInput: {
    marginLeft: 10,
  },
  selectText: {
    flex: 1,
    marginLeft: 8,
    color: '#A7AABB',
    fontSize: 13,
  },
  selectValue: {
    color: '#17192E',
  },
  errorText: {
    marginTop: 3,
    marginLeft: 3,
    marginBottom: -7,
    color: '#B72D39',
    fontSize: 9,
  },
  bottomArea: {
    paddingTop: 10,
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    width: '100%',
    maxWidth: 364,
    height: 48,
    alignSelf: 'center',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4258C5',
    shadowColor: '#263FAA',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  savePressed: {
    opacity: 0.86,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 17, 35, 0.32)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    marginBottom: 10,
    color: '#15172D',
    fontSize: 15,
    fontWeight: '700',
  },
  optionRow: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionPressed: {
    backgroundColor: '#F2F3FA',
  },
  optionFlag: {
    width: 30,
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    color: '#24263B',
    fontSize: 13,
  },
  optionPrefix: {
    color: '#777B8F',
    fontSize: 12,
  },
});
