import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  description: string;
  /** Optional CTA button label. If provided, the button is rendered. */
  ctaLabel?: string;
  /** Called when the CTA button is pressed. */
  onCtaPress?: () => void;
}

/**
 * A reusable empty state component with a title, description, and optional CTA button.
 * Used across Group, Itinerary, and Goals sections.
 */
export function EmptyState({ title, description, ctaLabel, onCtaPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCtaPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: AutumnColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
