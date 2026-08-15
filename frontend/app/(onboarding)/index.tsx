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
import { Colors } from '@/constants/colors';
import { OnboardingSlide, SlideData } from '@/components/onboarding/OnboardingSlide';
import { PaginationDots } from '@/components/onboarding/PaginationDots';

/**
 * Onboarding slide data. Easy to edit — just update text/image references here.
 * TODO: Replace image strings with actual require() imports once assets are provided.
 */
const SLIDES: SlideData[] = [
  {
    id: '1',
    title: 'TITLE',
    description: 'Traveling with friends made fun and easy',
    image: 'slide-1.png',
  },
  {
    id: '2',
    title: 'TITLE',
    description: 'Traveling with friends made fun and easy',
    image: 'slide-2.png',
  },
  {
    id: '3',
    title: 'TITLE',
    description: 'Traveling with friends made fun and easy',
    image: 'slide-3.png',
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
            <Text style={styles.getStartedText}>Get Started {'>'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip {'>'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flatList: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.accent,
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getStartedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.buttonText,
  },
});
