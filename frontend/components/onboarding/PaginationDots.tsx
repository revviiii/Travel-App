import { View, StyleSheet } from 'react-native';
import { AutumnColors } from '@/constants/colors';

interface PaginationDotsProps {
  /** Total number of slides */
  total: number;
  /** Currently active slide index (0-based) */
  activeIndex: number;
}

export function PaginationDots({ total, activeIndex }: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: AutumnColors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: AutumnColors.chipBorder,
  },
});
