import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export interface SlideData {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface OnboardingSlideProps {
  slide: SlideData;
  width: number;
}

export function OnboardingSlide({ slide, width }: OnboardingSlideProps) {
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{slide.title}</Text>

      {/* TODO: Replace with exported Figma onboarding illustration */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>ONBOARDING IMAGE</Text>
        <Text style={styles.imagePlaceholderLabel}>{slide.image}</Text>
      </View>

      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: Colors.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 1,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.placeholderText,
  },
  imagePlaceholderLabel: {
    fontSize: 12,
    color: Colors.placeholderText,
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
});
