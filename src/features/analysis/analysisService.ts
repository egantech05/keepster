import type { Asset } from 'expo-media-library';
import { InteractionManager } from 'react-native';
import { detectDuplicateGroups, refineDuplicateGroups } from './duplicateDetector';
import { detectBlurryAssets } from './blurDetector';
import { logger } from '../../lib/logger';

export type AnalysisResult = {
  duplicates: ReturnType<typeof detectDuplicateGroups>;
  blurry: Awaited<ReturnType<typeof detectBlurryAssets>>;
};

let isRunning = false;
let lastRunAt = 0;
const MIN_INTERVAL_MS = 30000;

export function startBackgroundAnalysis(assets: Asset[], onResult?: (result: AnalysisResult) => void) {
  const now = Date.now();
  if (isRunning || now - lastRunAt < MIN_INTERVAL_MS) return;

  isRunning = true;
  lastRunAt = now;

  InteractionManager.runAfterInteractions(() => {
    setTimeout(async () => {
      try {
        const stageOne = detectDuplicateGroups(assets);
        const duplicates = await refineDuplicateGroups(stageOne);
        const blurry = await detectBlurryAssets(assets);
        onResult?.({ duplicates, blurry });
      } catch (error) {
        logger.warn('Analysis failed', error);
      } finally {
        isRunning = false;
      }
    }, 0);
  });
}
