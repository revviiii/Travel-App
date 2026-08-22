import { type ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AutumnColors } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Minimum visible sheet height at collapsed state.
 * Must accommodate: drag handle touch area (40) + tab row (~48) + spacing (16) + safe area.
 * This guarantees the handle and navigation remain visible and reachable on all devices.
 */
const MIN_VISIBLE_COLLAPSED = 120;

/**
 * Snap positions as distance from the top of the screen.
 * Higher value = sheet is further down = more map visible.
 *
 * - Expanded (~12% from top): shows most Discovery content
 * - Partial (~45% from top): balanced map + content view (default)
 * - Collapsed (~78% from top): map-focused, only handle + tabs visible
 *
 * The collapsed position is clamped to ensure MIN_VISIBLE_COLLAPSED is always preserved.
 */
const EXPANDED_TOP = SCREEN_HEIGHT * 0.12;
const PARTIAL_TOP = SCREEN_HEIGHT * 0.45;
const COLLAPSED_TOP = Math.min(
  SCREEN_HEIGHT * 0.78,
  SCREEN_HEIGHT - MIN_VISIBLE_COLLAPSED,
);

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
};

interface DiscoveryBottomSheetProps {
  children: ReactNode;
}

/**
 * A draggable bottom sheet for the Discovery screen.
 * Uses react-native-gesture-handler + react-native-reanimated.
 *
 * Three snap states: expanded, partial (default), collapsed (map-focused).
 * The pan gesture is attached to a generous invisible touch area around the
 * visible drag handle. Content inside (FlatList, ScrollView) scrolls independently.
 *
 * // TODO: Replace placeholder with interactive map and map gestures
 */
export function DiscoveryBottomSheet({ children }: DiscoveryBottomSheetProps) {
  const insets = useSafeAreaInsets();

  // Adjust collapsed to also account for runtime safe-area insets
  const collapsedWithInsets = Math.min(
    COLLAPSED_TOP,
    SCREEN_HEIGHT - MIN_VISIBLE_COLLAPSED - insets.bottom,
  );

  // Default to partial (balanced view)
  const translateY = useSharedValue(PARTIAL_TOP);
  const contextY = useSharedValue(0);

  const expandedBound = EXPANDED_TOP;
  const collapsedBound = collapsedWithInsets;

  const snapPoints = [expandedBound, PARTIAL_TOP, collapsedBound];

  const snapToNearest = (y: number) => {
    'worklet';
    let closest = snapPoints[0];
    let minDist = Math.abs(y - snapPoints[0]);
    for (let i = 1; i < snapPoints.length; i++) {
      const dist = Math.abs(y - snapPoints[i]);
      if (dist < minDist) {
        minDist = dist;
        closest = snapPoints[i];
      }
    }
    return closest;
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = contextY.value + event.translationY;
      // Clamp between expanded and collapsed bounds
      translateY.value = Math.max(expandedBound, Math.min(collapsedBound, newY));
    })
    .onEnd((event) => {
      const target = snapToNearest(translateY.value + event.velocityY * 0.1);
      translateY.value = withSpring(target, SPRING_CONFIG);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    height: SCREEN_HEIGHT - translateY.value,
  }));

  return (
    <Animated.View style={[styles.sheet, animatedStyle]}>
      {/* Drag handle — invisible touch area is generous, visible handle is small */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleTouchArea}>
          <View style={styles.handleBar} />
        </View>
      </GestureDetector>

      {/* Sheet content */}
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AutumnColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 8,
  },
  handleTouchArea: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AutumnColors.chipBorder,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
});
