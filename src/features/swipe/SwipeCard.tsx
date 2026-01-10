import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import type { Asset } from 'expo-media-library';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useSwipe } from './useSwipe';
import { AssetImage } from '../photos/AssetImage';

type SwipeCardProps = {
  asset: Asset;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
};

function SwipeCardComponent({ asset, onSwipeLeft, onSwipeRight, disabled }: SwipeCardProps) {
  const { gesture, cardStyle, leftLabelStyle, rightLabelStyle } = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    enabled: !disabled,
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <AssetImage asset={asset} style={styles.image} resizeMode="cover" />
        <Animated.View style={[styles.labelContainer, styles.leftLabel, leftLabelStyle]}>
          <Text style={[styles.labelText, styles.deleteText]}>DELETE</Text>
        </Animated.View>
        <Animated.View style={[styles.labelContainer, styles.rightLabel, rightLabelStyle]}>
          <Text style={[styles.labelText, styles.keepText]}>KEEP</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export const SwipeCard = memo(SwipeCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  leftLabel: {
    left: 20,
  },
  rightLabel: {
    right: 20,
  },
  labelText: {
    fontFamily: typography.titleFont,
    fontSize: 14,
    letterSpacing: 1,
  },
  deleteText: {
    color: colors.danger,
  },
  keepText: {
    color: colors.accent,
  },
});
