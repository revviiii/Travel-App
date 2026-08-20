import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface GroupMemberCardProps {
  name: string;
  /** Temporary preference labels for layout testing */
  preferences?: string[];
  onMenuPress?: () => void;
}

/**
 * A member row/card for the Group Details "See Group Members" section.
 * Displays avatar placeholder, member name, preference chips, and action menu placeholder.
 *
 * // TODO: Replace with real group member/profile data
 * // TODO: Load member preferences from user profiles
 */
export function GroupMemberCard({ name, preferences = [], onMenuPress }: GroupMemberCardProps) {
  return (
    <View style={styles.card}>
      {/* TODO: Replace with user profile/avatar */}
      <View style={styles.avatar} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
        <Text style={styles.subtitle}>Preferences</Text>

        {preferences.length > 0 && (
          <View style={styles.chipRow}>
            {preferences.map((pref, idx) => (
              <View key={idx} style={styles.chip}>
                {/* TODO: Replace with final Figma preference SVG icon */}
                <View style={styles.chipIcon} />
                <Text style={styles.chipLabel} numberOfLines={1}>
                  {pref}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* TODO: Replace with final Figma menu/action SVG icon */}
      <TouchableOpacity
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Member options"
        hitSlop={10}
        style={styles.menuButton}
      >
        <View style={styles.menuIconPlaceholder} />
      </TouchableOpacity>
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
  chipIcon: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
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
  menuIconPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
});
