import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface TravelGoalCardProps {
  text: string;
  onLongPress: () => void;
}

/**
 * A goal card displaying a single travel goal.
 * Supports long-press to trigger the delete confirmation flow.
 */
export function TravelGoalCard({ text, onLongPress }: TravelGoalCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`Travel goal: ${text}. Long press to remove.`}
      accessibilityHint="Long press to remove this goal"
    >
      <View style={styles.card}>
        {/* Decorative accent bar */}
        <View style={styles.accentBar} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AutumnColors.chipBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AutumnColors.chipBorder,
    padding: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  accentBar: {
    width: 4,
    minHeight: 20,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: AutumnColors.primary,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: AutumnColors.chipText,
    lineHeight: 20,
  },
});
