import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PlaceCardProps {
  category: string;
  name: string;
  location: string;
  rating: number | null;
  status: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onDetailsPress?: () => void;
  /** Optional callback for the circular Add-to-Itinerary action */
  onAddToItinerary?: () => void;
  photoUri?: string;
  photoHeaders?: Record<string, string>;
}

/**
 * A recommendation/place card for the Discovery interface.
 * Displays a placeholder image, category badge, place name, location, rating, and status.
 * Supports an optional action for saving a live result or voting on a saved place.
 */
export function PlaceCard({
  category,
  name,
  location,
  rating,
  status,
  actionLabel = 'View details',
  onActionPress,
  onDetailsPress,
  onAddToItinerary,
  photoUri,
  photoHeaders,
}: PlaceCardProps) {
  const action = onActionPress ?? onAddToItinerary;
  const resolvedActionLabel =
    actionLabel === 'View details' && onAddToItinerary ? 'Add to itinerary' : actionLabel;

  return (
    <View style={styles.card}>
      {photoUri ? (
        <Image
          accessibilityLabel={`Photo of ${name}`}
          contentFit="cover"
          source={{ uri: photoUri, headers: photoHeaders }}
          style={styles.placeImage}
          transition={180}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons color={AutumnColors.chipBorder} name="image-outline" size={28} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>

        <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
          {location}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.rating}>{rating === null ? 'Google' : rating.toFixed(1)}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          disabled={!onDetailsPress}
          onPress={onDetailsPress}
          style={styles.linkButton}
          accessibilityRole="link"
          accessibilityLabel={`Open ${name} in Google Maps`}
        >
          <Ionicons color={AutumnColors.primary} name="open-outline" size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!action}
          onPress={action}
          style={styles.linkButton}
          accessibilityRole="button"
          accessibilityLabel={resolvedActionLabel}
        >
          <Ionicons color={AutumnColors.primary} name="add" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    padding: 12,
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
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: AutumnColors.heading,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: AutumnColors.chipBackground,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AutumnColors.autumnAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: AutumnColors.heading,
  },
  location: {
    fontSize: 12,
    fontWeight: '400',
    color: AutumnColors.body,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: AutumnColors.goldenAccent,
  },
  status: {
    fontSize: 11,
    fontWeight: '400',
    color: AutumnColors.body,
  },
  linkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AutumnColors.chipBackground,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    gap: 7,
  },
});
