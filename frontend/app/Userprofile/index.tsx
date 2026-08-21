import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type RelativePathString } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const personalInfoIcon = require('@/assets/images/User_dark_ic.svg');
const travelSettingsIcon = require('@/assets/images/travel_setting_ic.svg');
const logoutIcon = require('@/assets/images/logout_ic.svg');
const cameraIcon = require('@/assets/images/Camera_ic.svg');

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();

  const [userName, setUserName] = useState('Traveler');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getMyProfile(), supabase.auth.getSession()])
      .then(([profile, sessionResult]) => {
        if (!isCurrent) return;
        setUserName(profile.full_name || 'Traveler');
        setUserEmail(sessionResult.data.session?.user.email ?? '');
      })
      .catch((error) => {
        if (isCurrent) {
          Alert.alert(
            'Unable to load profile',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

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
    router.push('/Personalinfo' as RelativePathString);
  };

  const handleTravelPreferences = () => {
    router.push('/Travelpreferences' as RelativePathString);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Unable to log out', error.message);
      return;
    }
    router.dismissAll();
    router.replace('/Login');
  };

  return (
    <View style={styles.viewport}>
      <View
        style={[
          styles.mobileFrame,
          {
            paddingTop: insets.top + 4,
            paddingBottom: Math.max(insets.bottom + 20, 24),
          },
        ]}
      >
        <StatusBar style="dark" />

        <View style={styles.content}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.controlPressed]}
          >
            <Ionicons color="#17192E" name="arrow-back" size={20} />
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

            {isLoading ? (
              <ActivityIndicator color="#4258C5" style={styles.profileLoader} />
            ) : (
              <>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </>
            )}
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
              onPress={() => void handleLogout()}
              showChevron={false}
            />
          </View>
        </View>
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
      hitSlop={{ top: 2, bottom: 2 }}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <Image contentFit="contain" source={icon} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      {showChevron ? (
        <Ionicons color="#4B4F63" name="chevron-forward" size={16} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F4F5F8',
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 414,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPressed: {
    opacity: 0.55,
  },
  profileSummary: {
    marginTop: -2,
    alignItems: 'center',
  },
  avatarFrame: {
    width: 64,
    height: 64,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.15,
    borderColor: '#8D91A1',
    backgroundColor: '#D7D8DA',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cameraIcon: {
    width: 20,
    height: 20,
  },
  userName: {
    marginTop: 8,
    color: '#181A32',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  profileLoader: {
    marginTop: 12,
  },
  userEmail: {
    marginTop: 2,
    color: '#7C8093',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    textAlign: 'center',
  },
  menu: {
    width: '100%',
    marginTop: 22,
    gap: 10,
  },
  menuItem: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#111326',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  menuItemPressed: {
    backgroundColor: '#F8F8FB',
    transform: [{ scale: 0.995 }],
  },
  menuIcon: {
    width: 19,
    height: 19,
    marginRight: 10,
  },
  menuLabel: {
    flex: 1,
    color: '#17192E',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  destructiveLabel: {
    color: '#B91C21',
  },
});
