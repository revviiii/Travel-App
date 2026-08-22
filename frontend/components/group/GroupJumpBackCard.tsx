import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface GroupJumpBackCardProps {
  title: string;
  attractionCount: number;
  onPress?: () => void;
  photoUri?: string;
  photoHeaders?: Record<string, string>;
}

/**
 * A "Jump Back In" card for the Group Details screen.
 * Displays a category/destination with attraction count and an image placeholder.
 *
 * // TODO: Replace with group itinerary/recommendation API data
 * // TODO: Replace with actual place image from API
 */
export function GroupJumpBackCard({
  title,
  attractionCount,
  onPress,
  photoUri,
  photoHeaders,
}: GroupJumpBackCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${attractionCount} attractions`}
      style={styles.card}
    >
      {photoUri ? (
        <Image
          contentFit="cover"
          source={{ uri: photoUri, headers: photoHeaders }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      {/* Overlay content */}
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle}>
          Attractions ({attractionCount})
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: AutumnColors.heading,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AutumnColors.chipBorder,
    opacity: 0.6,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
