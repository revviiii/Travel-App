import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';
import { OnboardingSlide, SlideData } from '@/components/onboarding/OnboardingSlide';
import { PaginationDots } from '@/components/onboarding/PaginationDots';

/**
 * Onboarding slide data with real assets and exact approved copy.
 */
const SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'Plan Better, Together.',
    description: 'Plan trips, share goals, and make every adventure count.',
    image: require('@/assets/images/slide1.png'),
  },
  {
    id: '2',
    title: 'Pick. Vote. Go.',
    description: 'Share your favorite places and let the group decide what\u2019s next.',
    image: require('@/assets/images/slide2.png'),
  },
  {
    id: '3',
    title: 'Explore Your Kind of Trip.',
    description: 'Discover places that match your interests and make every stop worth exploring.',
    image: require('@/assets/images/slide3.png'),
  },
];

export default function OnboardingCarousel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleSkip = () => {
    router.push('/(onboarding)/location');
  };

  const handleGetStarted = () => {
    router.push('/(onboarding)/location');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OnboardingSlide slide={item} width={width} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom navigation area */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <PaginationDots total={SLIDES.length} activeIndex={activeIndex} />

        {isLastSlide ? (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            {/* TODO: Replace with final Figma Get Started arrow SVG */}
            <View style={styles.arrowPlaceholder} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
            {/* TODO: Replace with final Figma Skip chevron SVG */}
            <View style={styles.skipChevronPlaceholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AutumnColors.background,
  },
  flatList: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: AutumnColors.primary,
  },
  skipChevronPlaceholder: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: AutumnColors.chipBorder,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AutumnColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  getStartedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrowPlaceholder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
