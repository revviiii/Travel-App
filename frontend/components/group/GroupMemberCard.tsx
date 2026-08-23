import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';
import { PREFERENCE_ICONS } from '@/components/onboarding/PreferenceChip';

interface PreferenceDisplay {
  id: string;
  label: string;
}

interface GroupMemberCardProps {
  name: string;
  /** Preference objects with id and label for correct icon resolution */
  preferences?: PreferenceDisplay[];
  avatarUrl?: string | null;
  onMenuPress?: () => void;
}

/**
 * A member row/card for the Group Details "See Group Members" section.
 * Displays avatar placeholder, member name, preference chips, and action menu placeholder.
 *
 * // TODO: Replace with real group member/profile data
 * // TODO: Load member preferences from user profiles
 */
export function GroupMemberCard({
  name,
  preferences = [],
  avatarUrl,
  onMenuPress,
}: GroupMemberCardProps) {
  return (
    <View style={styles.card}>
      {avatarUrl ? (
        <Image contentFit="cover" source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Ionicons color={AutumnColors.body} name="person" size={20} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
        <Text style={styles.subtitle}>Preferences</Text>

        {preferences.length > 0 && (
          <View style={styles.chipRow}>
            {preferences.map((pref) => (
              <View key={pref.id} style={styles.chip}>
                <MaterialCommunityIcons
                  color={AutumnColors.chipText}
                  name={PREFERENCE_ICONS[pref.id] ?? 'map-marker-outline'}
                  size={11}
                />
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {pref.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {onMenuPress ? (
        <TouchableOpacity
          onPress={onMenuPress}
          accessibilityRole="button"
          accessibilityLabel="Member options"
          hitSlop={10}
          style={styles.menuButton}
        >
          <Ionicons color={AutumnColors.body} name="ellipsis-horizontal" size={18} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.chipBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: AutumnColors.body,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: AutumnColors.chipText,
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
