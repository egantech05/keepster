import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Asset } from 'expo-media-library';
import { deleteAssetsBatch } from '../photos/photoService';
import { loadInitialQueue, loadMoreQueue } from '../photos/photoQueue';
import { logger } from '../../lib/logger';
import { nowMs } from '../../lib/time';
import { createDeleteUndoController } from './deleteUndoController';
import type { SessionState } from './sessionTypes';

const MIN_QUEUE_SIZE = 50;
const BUFFER_SIZE = 20;
const INITIAL_QUEUE_TARGET = MIN_QUEUE_SIZE + BUFFER_SIZE;
const DELETE_BATCH_SIZE = 12;

const initialState: SessionState = {
  status: 'idle',
  queue: [],
  keptCount: 0,
  deletedCount: 0,
  startedAt: null,
  endedAt: null,
  lastAction: null,
  pendingDeleteIds: [],
  scanningAlbums: false,
  loading: false,
  error: null,
  hasNextPage: true,
  endCursor: undefined,
};

type SessionStore = {
  state: SessionState;
  startSession: () => void;
  resetSession: () => void;
  finishSession: () => void;
  loadInitialAssets: () => Promise<void>;
  loadMoreAssets: () => Promise<void>;
  markKept: (asset: Asset) => void;
  markDeleted: (asset: Asset) => void;
  skipAsset: (asset: Asset) => void;
  undoDelete: () => void;
};

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const pendingDeleteIdsRef = useRef<string[]>([]);

  const flushPendingDeletes = useCallback((batch?: string[]) => {
    const ids = batch ?? pendingDeleteIdsRef.current;
    if (ids.length === 0) return;
    pendingDeleteIdsRef.current = [];
    setState((prev) => ({ ...prev, pendingDeleteIds: [] }));
    deleteAssetsBatch(ids).catch((error) => logger.warn('Delete failed', error));
  }, []);

  const commitDelete = useCallback(
    (asset: Asset) => {
      const current = pendingDeleteIdsRef.current;
      if (current.includes(asset.id)) return;
      const next = [...current, asset.id];
      pendingDeleteIdsRef.current = next;
      setState((prev) => ({ ...prev, pendingDeleteIds: next }));
      if (next.length >= DELETE_BATCH_SIZE) {
        flushPendingDeletes(next);
      }
    },
    [flushPendingDeletes]
  );

  const deleteController = useMemo(
    () =>
      createDeleteUndoController({
        commitDelete,
        onStateChange: (lastAction) => {
          setState((prev) => ({ ...prev, lastAction }));
        },
      }),
    [commitDelete]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        deleteController.commitExpired();
      }
    });

    return () => subscription.remove();
  }, [deleteController]);

  const startSession = useCallback(() => {
    if (stateRef.current.lastAction) {
      deleteController.commitPending();
    }
    if (pendingDeleteIdsRef.current.length > 0) {
      flushPendingDeletes();
    }
    setState({
      ...initialState,
      status: 'running',
      startedAt: nowMs(),
    });
  }, [deleteController, flushPendingDeletes]);

  const resetSession = useCallback(() => {
    pendingDeleteIdsRef.current = [];
    setState({
      ...initialState,
    });
  }, []);

  const finishSession = useCallback(() => {
    deleteController.commitPending();
    flushPendingDeletes();
    setState((prev) => ({
      ...prev,
      status: 'summary',
      endedAt: nowMs(),
    }));
  }, [deleteController, flushPendingDeletes]);

  const loadInitialAssets = useCallback(async () => {
    if (stateRef.current.loading) return;
    setState((prev) => ({ ...prev, loading: true, scanningAlbums: true, error: null }));
    try {
      const queueState = await loadInitialQueue(INITIAL_QUEUE_TARGET);
      setState((prev) => ({
        ...prev,
        queue: queueState.assets,
        endCursor: queueState.endCursor,
        hasNextPage: queueState.hasNextPage,
        scanningAlbums: false,
        loading: false,
      }));
    } catch (error) {
      logger.warn('Queue load failed', error);
      setState((prev) => ({
        ...prev,
        error: 'Unable to load photos. Please try again.',
        scanningAlbums: false,
        loading: false,
      }));
    }
  }, []);

  const loadMoreAssets = useCallback(async () => {
    const current = stateRef.current;
    if (current.loading || !current.hasNextPage || current.queue.length >= MIN_QUEUE_SIZE) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const next = await loadMoreQueue(
        {
          assets: current.queue,
          endCursor: current.endCursor,
          hasNextPage: current.hasNextPage,
        },
        INITIAL_QUEUE_TARGET
      );
      setState((prev) => ({
        ...prev,
        queue: next.assets,
        endCursor: next.endCursor,
        hasNextPage: next.hasNextPage,
        loading: false,
      }));
    } catch (error) {
      logger.warn('Queue refill failed', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const markKept = useCallback((asset: Asset) => {
    setState((prev) => ({
      ...prev,
      keptCount: prev.keptCount + 1,
      queue: prev.queue.filter((item) => item.id !== asset.id),
    }));
  }, []);

  const markDeleted = useCallback((asset: Asset) => {
    deleteController.scheduleDelete(asset);
    setState((prev) => ({
      ...prev,
      deletedCount: prev.deletedCount + 1,
      queue: prev.queue.filter((item) => item.id !== asset.id),
    }));
  }, [deleteController]);

  const skipAsset = useCallback((asset: Asset) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((item) => item.id !== asset.id),
    }));
  }, []);

  const undoDelete = useCallback(() => {
    const restored = deleteController.undoDelete();
    if (!restored) return;
    setState((prev) => ({
      ...prev,
      deletedCount: Math.max(0, prev.deletedCount - 1),
      queue: [restored, ...prev.queue],
    }));
  }, [deleteController]);

  const value = useMemo(
    () => ({
      state,
      startSession,
      resetSession,
      finishSession,
      loadInitialAssets,
      loadMoreAssets,
      markKept,
      markDeleted,
      skipAsset,
      undoDelete,
    }),
    [
      state,
      startSession,
      resetSession,
      finishSession,
      loadInitialAssets,
      loadMoreAssets,
      markKept,
      markDeleted,
      skipAsset,
      undoDelete,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionStore(): SessionStore {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionStore must be used within SessionProvider');
  }
  return context;
}
