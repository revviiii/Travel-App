import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const personalInfoIcon = require('@/assets/images/User_dark_ic.svg');
const travelSettingsIcon = require('@/assets/images/travel_setting_ic.svg');
const logoutIcon = require('@/assets/images/logout_ic.svg');
const cameraIcon = require('@/assets/images/Camera_ic.svg');

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 320 ? 22 : 32;

  // TODO: Replace these values with the authenticated user's profile data.
  const userName = 'Username';
  const userEmail = 'username@email.com';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/home');
  };

  const handleChangePhoto = () => {
    Alert.alert('Profile photo', 'Photo selection will be connected here.');
  };

  const handlePersonalInfo = () => {
    router.push('/Personalinfo');
  };

  const handleTravelPreferences = () => {
    router.push('/Travelpreferences');
  };

  const handleLogout = () => {
    // There is no persisted auth provider yet. Dismissing the stack unmounts
    // authenticated screens and clears their local state before opening Login.
    router.dismissAll();
    router.replace('/Login');
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + 14,
          paddingBottom: Math.max(insets.bottom + 24, 32),
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      <StatusBar style="dark" />

      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.controlPressed]}
      >
        <Text style={styles.backIcon}>←</Text>
      </Pressable>

      <View style={styles.profileSummary}>
        <View style={styles.avatarFrame}>
          <View style={styles.avatarPlaceholder} />
          <Pressable
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            hitSlop={6}
            onPress={handleChangePhoto}
            style={({ pressed }) => [styles.cameraButton, pressed && styles.controlPressed]}
          >
            <Image contentFit="contain" source={cameraIcon} style={styles.cameraIcon} />
          </Pressable>
        </View>

        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      <View style={styles.menu}>
        <ProfileMenuItem
          icon={personalInfoIcon}
          label="Personal Info"
          onPress={handlePersonalInfo}
        />
        <ProfileMenuItem
          icon={travelSettingsIcon}
          label="Travel Preferences"
          onPress={handleTravelPreferences}
        />
        <ProfileMenuItem
          destructive
          icon={logoutIcon}
          label="Logout"
          onPress={handleLogout}
          showChevron={false}
        />
      </View>
    </View>
  );
}

type ProfileMenuItemProps = {
  destructive?: boolean;
  icon: number;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
};

function ProfileMenuItem({
  destructive = false,
  icon,
  label,
  onPress,
  showChevron = true,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <Image contentFit="contain" source={icon} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      {showChevron ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#111326',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 22,
  },
  controlPressed: {
    opacity: 0.55,
  },
  profileSummary: {
    marginTop: -3,
    alignItems: 'center',
  },
  avatarFrame: {
    width: 62,
    height: 62,
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.25,
    borderColor: '#8D91A1',
    backgroundColor: '#D7D8DA',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cameraIcon: {
    width: 19,
    height: 19,
  },
  userName: {
    marginTop: 8,
    color: '#181A32',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  userEmail: {
    marginTop: 2,
    color: '#7C8093',
    fontSize: 9,
    fontWeight: '400',
    lineHeight: 12,
    textAlign: 'center',
  },
  menu: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: 17,
    gap: 9,
  },
  menuItem: {
    width: '100%',
    height: 38,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#111326',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
  },
  menuItemPressed: {
    backgroundColor: '#F8F8FB',
    transform: [{ scale: 0.995 }],
  },
  menuIcon: {
    width: 17,
    height: 17,
    marginRight: 8,
  },
  menuLabel: {
    flex: 1,
    color: '#17192E',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  destructiveLabel: {
    color: '#B91C21',
  },
  chevron: {
    color: '#15172C',
    fontSize: 19,
    fontWeight: '300',
    lineHeight: 20,
  },
});
