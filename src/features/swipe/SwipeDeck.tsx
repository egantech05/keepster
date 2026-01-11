import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Asset } from 'expo-media-library';
import { SwipeCard } from './SwipeCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { AssetImage } from '../photos/AssetImage';

type SwipeDeckProps = {
  asset: Asset | null;
  nextAsset: Asset | null;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
};

export function SwipeDeck({ asset, nextAsset, onSwipeLeft, onSwipeRight, disabled }: SwipeDeckProps) {
  if (!asset) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No more photos</Text>
      </View>
    );
  }

  return (
    <View style={styles.deck}>
      {nextAsset && (
        <View style={styles.nextCard}>
          <AssetImage asset={nextAsset} style={styles.nextImage} resizeMode="cover" />
        </View>
      )}
      <SwipeCard
        key={asset.id}
        asset={asset}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCard: {
    position: 'absolute',
    width: '96%',
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    transform: [{ scale: 0.96 }, { translateY: 16 }],
  },
  nextImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.bodyFont,
    color: colors.textMuted,
  },
});
