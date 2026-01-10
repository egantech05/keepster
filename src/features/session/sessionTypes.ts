import type { Asset } from 'expo-media-library';

export type LastAction = {
  type: 'delete';
  asset: Asset;
  expiresAt: number;
};

export type SessionStatus = 'idle' | 'running' | 'summary';

export type SessionState = {
  status: SessionStatus;
  queue: Asset[];
  keptCount: number;
  deletedCount: number;
  startedAt: number | null;
  endedAt: number | null;
  lastAction: LastAction | null;
  pendingDeleteIds: string[];
  scanningAlbums: boolean;
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  endCursor: string | undefined;
};
