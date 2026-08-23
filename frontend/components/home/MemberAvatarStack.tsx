import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

const MAX_VISIBLE = 4;
const AVATAR_SIZE = 28;
const OVERLAP = -8;

interface MemberAvatarInfo {
  avatar_url: string | null;
}

interface MemberAvatarStackProps {
  /** Total number of members in the group (used to compute +N overflow) */
  memberCount: number;
  /** Actual member preview data (up to 4). When provided, renders real avatars. */
  members?: MemberAvatarInfo[];
}

/**
 * Overlapping avatar stack for group cards.
 * Renders actual member profile images when available, with a fallback
 * placeholder for members without a photo. Shows +N for overflow.
 * Renders nothing when memberCount is 0.
 */
export function MemberAvatarStack({ memberCount, members = [] }: MemberAvatarStackProps) {
  if (memberCount === 0) {
    return null;
  }

  const visibleCount = Math.min(memberCount, MAX_VISIBLE);
  const overflow = memberCount - MAX_VISIBLE;

  return (
    <View style={styles.container}>
      {Array.from({ length: visibleCount }, (_, index) => {
        const member = members[index];
        const avatarUrl = member?.avatar_url;

        return avatarUrl ? (
          <Image
            key={index}
            source={{ uri: avatarUrl }}
            style={[styles.avatar, index > 0 && { marginLeft: OVERLAP }]}
            contentFit="cover"
          />
        ) : (
          <View
            key={index}
            style={[styles.avatarPlaceholder, index > 0 && { marginLeft: OVERLAP }]}
          >
            <Ionicons color={AutumnColors.body} name="person" size={14} />
          </View>
        );
      })}
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: AutumnColors.chipBorder,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
