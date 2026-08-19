import { View, Text, StyleSheet, Image } from 'react-native';
import { AutumnColors } from '@/constants/colors';

export interface SlideData {
  id: string;
  title: string;
  description: string;
  image: any;
}

interface OnboardingSlideProps {
  slide: SlideData;
  width: number;
}

export function OnboardingSlide({ slide, width }: OnboardingSlideProps) {
  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.title}>{slide.title}</Text>

      <Image
        source={slide.image}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel={`Onboarding illustration for: ${slide.title}`}
      />

      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: AutumnColors.heading,
    textAlign: 'center',
    marginBottom: 22,
  },
  image: {
    width: '88%',
    maxHeight: '55%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    flexShrink: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: AutumnColors.body,
    textAlign: 'center',
    marginTop: 26,
    lineHeight: 23,
    paddingHorizontal: 20,
  },
});
