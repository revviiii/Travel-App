import { StyleSheet, Text, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

const MAX_VISIBLE = 4;
const AVATAR_SIZE = 28;
const OVERLAP = -8;

interface MemberAvatarStackProps {
  /** Total number of members in the group */
  memberCount: number;
}

/**
 * Overlapping avatar stack for group cards.
 * Shows up to 4 circular placeholders. If more than 4, shows +N.
 * Renders nothing when memberCount is 0.
 *
 * // TODO: Replace with actual member profile images from backend
 */
export function MemberAvatarStack({ memberCount }: MemberAvatarStackProps) {
  if (memberCount === 0) {
    return null;
  }

  const visibleCount = Math.min(memberCount, MAX_VISIBLE);
  const overflow = memberCount - MAX_VISIBLE;

  return (
    <View style={styles.container}>
      {Array.from({ length: visibleCount }, (_, index) => (
        <View
          key={index}
          style={[
            styles.avatar,
            index > 0 && { marginLeft: OVERLAP },
          ]}
        />
      ))}
      {overflow > 0 && (
        <View style={[styles.overflowBadge, { marginLeft: OVERLAP }]}>
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: AutumnColors.chipBorder,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  overflowBadge: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 10,
    fontWeight: '600',
    color: AutumnColors.chipText,
  },
});
