import type { Asset } from 'expo-media-library';
import type { LastAction } from './sessionTypes';
import { nowMs } from '../../lib/time';

export type DeleteUndoControllerOptions = {
  graceMs?: number;
  commitDelete: (asset: Asset) => void;
  onStateChange: (lastAction: LastAction | null) => void;
  now?: () => number;
  setTimer?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timerId: ReturnType<typeof setTimeout>) => void;
};

export type DeleteUndoController = {
  scheduleDelete: (asset: Asset) => void;
  undoDelete: () => Asset | null;
  commitExpired: () => void;
  commitPending: () => void;
  clear: () => void;
  getLastAction: () => LastAction | null;
};

export function createDeleteUndoController({
  graceMs = 60000,
  commitDelete,
  onStateChange,
  now = nowMs,
  setTimer = (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimer = (timerId) => clearTimeout(timerId),
}: DeleteUndoControllerOptions): DeleteUndoController {
  let lastAction: LastAction | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const updateState = (nextAction: LastAction | null) => {
    lastAction = nextAction;
    onStateChange(nextAction);
  };

  const clearTimerIfNeeded = () => {
    if (timer) {
      clearTimer(timer);
      timer = null;
    }
  };

  const scheduleDelete = (asset: Asset) => {
    if (lastAction) {
      commitDelete(lastAction.asset);
    }
    clearTimerIfNeeded();
    const expiresAt = now() + graceMs;
    updateState({ type: 'delete', asset, expiresAt });
    timer = setTimer(() => {
      if (!lastAction || lastAction.asset.id !== asset.id) return;
      commitDelete(asset);
      updateState(null);
      timer = null;
    }, graceMs);
  };

  const undoDelete = () => {
    if (!lastAction) return null;
    const asset = lastAction.asset;
    clearTimerIfNeeded();
    updateState(null);
    return asset;
  };

  const commitExpired = () => {
    if (!lastAction) return;
    if (lastAction.expiresAt > now()) return;
    commitDelete(lastAction.asset);
    clearTimerIfNeeded();
    updateState(null);
  };

  const commitPending = () => {
    if (!lastAction) return;
    commitDelete(lastAction.asset);
    clearTimerIfNeeded();
    updateState(null);
  };

  const clear = () => {
    clearTimerIfNeeded();
    updateState(null);
  };

  const getLastAction = () => lastAction;

  return {
    scheduleDelete,
    undoDelete,
    commitExpired,
    commitPending,
    clear,
    getLastAction,
  };
}
