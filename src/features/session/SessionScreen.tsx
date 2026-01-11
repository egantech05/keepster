import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Album, Asset } from 'expo-media-library';
import { AlbumPickerModal } from '../albums/AlbumPickerModal';
import { addAssetToAlbum, recordAlbumUsage } from '../albums/albumService';
import { SwipeDeck } from '../swipe/SwipeDeck';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { ProgressPill } from '../../components/ProgressPill';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useSessionStore } from './sessionStore';
import { logger } from '../../lib/logger';
import { startBackgroundAnalysis } from '../analysis/analysisService';

const HAPTICS_ENABLED = true;

export function SessionScreen() {
  const {
    state,
    loadInitialAssets,
    loadMoreAssets,
    markKept,
    markDeleted,
    skipAsset,
    undoDelete,
    finishSession,
  } = useSessionStore();
  const { message, showToast } = useToast();
  const [pendingKeepAsset, setPendingKeepAsset] = useState<Asset | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const processedCount = state.keptCount + state.deletedCount;
  const currentAsset = state.queue[0] ?? null;
  const nextAsset = state.queue[1] ?? null;

  useEffect(() => {
    if (state.status === 'running' && state.queue.length === 0 && !state.loading) {
      loadInitialAssets();
    }
  }, [loadInitialAssets, state.loading, state.queue.length, state.status]);

  useEffect(() => {
    if (state.queue.length > 0) {
      startBackgroundAnalysis(state.queue.slice(0, 120));
    }
  }, [state.queue]);



  useEffect(() => {
    if (state.status === 'running' && state.queue.length > 0) {
      loadMoreAssets();
    }
  }, [loadMoreAssets, state.queue.length, state.status]);


  const triggerHaptics = useCallback(async () => {
    if (!HAPTICS_ENABLED) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      logger.warn('Haptics failed', error);
    }
  }, []);

  const handleSwipeLeft = useCallback(() => {
    if (!currentAsset) return;
    markDeleted(currentAsset);
    triggerHaptics();
  }, [currentAsset, markDeleted, triggerHaptics]);

  const handleSwipeRight = useCallback(() => {
    if (!currentAsset) return;
    setPendingKeepAsset(currentAsset);
    setModalVisible(true);
    triggerHaptics();
  }, [currentAsset, triggerHaptics]);

  const handleConfirmAlbum = useCallback(
    async (album: Album | null) => {
      setModalVisible(false);
      const asset = pendingKeepAsset;
      setPendingKeepAsset(null);
      if (!asset || !album) return;
      try {
        await addAssetToAlbum(asset, album);
        await recordAlbumUsage(album.id);
        markKept(asset);
      } catch (error) {
        logger.warn('Album add failed', error);
        showToast('Could not save to album');
      }
    },
    [markKept, pendingKeepAsset, showToast]
  );

  const handleCancelAlbum = useCallback(() => {
    setModalVisible(false);
    setPendingKeepAsset(null);
  }, []);

  const isUndoVisible = useMemo(() => !!state.lastAction, [state.lastAction]);

  const handleSkip = useCallback(() => {
    if (!currentAsset || modalVisible) return;
    skipAsset(currentAsset);
    triggerHaptics();
  }, [currentAsset, modalVisible, skipAsset, triggerHaptics]);

  const handleDone = useCallback(() => {
    finishSession();
  }, [finishSession]);

  if (state.loading && state.queue.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>
          {state.scanningAlbums ? 'Scanning albums...' : 'Loading photos...'}
        </Text>
      </View>
    );
  }

  if (state.error && state.queue.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{state.error}</Text>
        <Button label="Try again" onPress={loadInitialAssets} variant="ghost" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProgressPill label={`${processedCount} cleaned`} />
      <Button label="Done" onPress={handleDone} variant="ghost" style={styles.doneButton} />
      <View style={styles.deckWrapper}>
        <SwipeDeck
          asset={currentAsset}
          nextAsset={nextAsset}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          disabled={modalVisible}
        />
      </View>
      <View style={styles.bottomControls} pointerEvents="box-none">
        <IconButton
          icon="close"
          onPress={handleSkip}
          accessibilityLabel="Skip"
          variant="ghost"
          style={styles.skipButton}
          disabled={modalVisible}
        />
        {isUndoVisible && (
          <IconButton
            icon="arrow-undo"
            onPress={undoDelete}
            accessibilityLabel="Undo"
            variant="ghost"
            style={styles.undoButton}
          />
        )}
      </View>
      <AlbumPickerModal
        visible={modalVisible}
        onConfirm={handleConfirmAlbum}
        onCancel={handleCancelAlbum}
      />
      <Toast message={message} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  doneButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deckWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  bottomControls: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  skipButton: {
    alignSelf: 'center',
  },
  undoButton: {
    position: 'absolute',
    left: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: typography.bodyFont,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: typography.bodyFont,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
