import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';
import { MemberAvatarStack } from '@/components/home/MemberAvatarStack';

interface GroupCardProps {
  name: string;
  /** Total number of members. 0 means no members joined yet. */
  memberCount: number;
  imageUrl?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}

/**
 * A group card displaying the group name, member avatar stack, and a navigation chevron placeholder.
 * Adapts layout based on member count: no avatar area when 0, stack when 1+.
 * Supports long-press to trigger delete confirmation.
 */
export function GroupCard({
  name,
  memberCount,
  imageUrl,
  onPress,
  onLongPress,
  onMenuPress,
}: GroupCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={`Open group ${name}`}
        accessibilityHint={onLongPress ? 'Long press or use the menu to manage this group' : undefined}
        style={styles.cardContent}
      >
        {imageUrl ? (
          <Image contentFit="cover" source={{ uri: imageUrl }} style={styles.groupImage} />
        ) : (
          <MemberAvatarStack memberCount={memberCount} />
        )}

        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
      </TouchableOpacity>

      {onMenuPress ? (
        <TouchableOpacity
          accessibilityLabel={`Manage group ${name}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={onMenuPress}
          style={styles.menuButton}
        >
          <Ionicons color={AutumnColors.body} name="ellipsis-horizontal" size={22} />
        </TouchableOpacity>
      ) : (
        <Ionicons color={AutumnColors.body} name="chevron-forward" size={20} />
      )}
    </View>
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
  cardContent: {
    flex: 1,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  groupImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AutumnColors.chipBackground,
  },
});
