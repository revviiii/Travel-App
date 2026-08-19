import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PlaceCardProps {
  category: string;
  name: string;
  location: string;
  rating: number;
  status: string;
}

/**
 * A recommendation/place card for the Discovery interface.
 * Displays a placeholder image, category badge, place name, location, rating, and status.
 * All data is mock — clearly marked for future API replacement.
 *
 * // TODO: Replace mock recommendations with backend/maps API data
 */
export function PlaceCard({ category, name, location, rating, status }: PlaceCardProps) {
  return (
    <View style={styles.card}>
      {/* TODO: Replace with actual place image from API */}
      <View style={styles.imagePlaceholder} />

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
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      {/* TODO: Replace with final Figma link/share SVG icon */}
      <TouchableOpacity
        style={styles.linkButton}
        accessibilityRole="button"
        accessibilityLabel="View details"
      >
        <View style={styles.linkIconPlaceholder} />
      </TouchableOpacity>
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
  linkIconPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
  },
});
