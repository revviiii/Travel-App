import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';
import { MemberAvatarStack } from '@/components/home/MemberAvatarStack';

interface GroupCardProps {
  name: string;
  /** Total number of members. 0 means no members joined yet. */
  memberCount: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * A group card displaying the group name, member avatar stack, and a navigation chevron placeholder.
 * Adapts layout based on member count: no avatar area when 0, stack when 1+.
 * Supports long-press to trigger delete confirmation.
 */
export function GroupCard({ name, memberCount, onPress, onLongPress }: GroupCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`Group: ${name}`}
      accessibilityHint={onLongPress ? 'Long press to remove this group' : undefined}
      style={styles.card}
    >
      <MemberAvatarStack memberCount={memberCount} />

      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {name}
      </Text>

      {/* TODO: Replace with final Figma chevron/arrow SVG */}
      <View style={styles.chevronPlaceholder} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    paddingHorizontal: 16,
    minHeight: 64,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  chevronPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: AutumnColors.chipBorder,
  },
});
