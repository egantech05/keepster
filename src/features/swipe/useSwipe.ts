import { useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ROTATION_RANGE, SCREEN_WIDTH, SWIPE_OUT_DISTANCE, SWIPE_THRESHOLD } from './swipeAnimations';

const SWIPE_DURATION = 180;

export type SwipeHandlers = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  enabled?: boolean;
};

export function useSwipe({ onSwipeLeft, onSwipeRight, enabled = true }: SwipeHandlers) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const resetPosition = () => {
    translateX.value = 0;
    translateY.value = 0;
  };

  useEffect(() => {
    resetPosition();
  }, []);

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      const shouldSwipe = Math.abs(translateX.value) > SWIPE_THRESHOLD;
      if (!shouldSwipe) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }

      const direction = translateX.value > 0 ? 'right' : 'left';
      translateX.value = withTiming(
        direction === 'right' ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE,
        { duration: SWIPE_DURATION },
        () => {
          runOnJS(direction === 'right' ? onSwipeRight : onSwipeLeft)();
          translateX.value = 0;
          translateY.value = 0;
        }
      );
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, SCREEN_WIDTH],
      [-ROTATION_RANGE, ROTATION_RANGE],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  return {
    gesture,
    cardStyle,
    leftLabelStyle,
    rightLabelStyle,
  };
}
