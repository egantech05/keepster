import type { Asset } from 'expo-media-library';
import { fetchAssetsPage } from './photoService';
import { getAlbumMembershipIndex } from '../albums/albumMembershipService';

export type PhotoQueueState = {
  assets: Asset[];
  endCursor?: string;
  hasNextPage: boolean;
};

const PAGE_SIZE = 80;

export async function loadInitialQueue(minimumCount: number): Promise<PhotoQueueState> {
  const membership = await getAlbumMembershipIndex();
  const minimum = minimumCount;
  let queue: Asset[] = [];
  let endCursor: string | undefined;
  let hasNextPage = true;

  while (queue.length < minimum && hasNextPage) {
    const page = await fetchAssetsPage(endCursor, PAGE_SIZE);
    const looseAssets = page.assets.filter((asset) => !membership.has(asset.id));
    queue = queue.concat(looseAssets);
    endCursor = page.endCursor;
    hasNextPage = page.hasNextPage;
    if (page.assets.length === 0) {
      hasNextPage = false;
    }
  }

  return {
    assets: queue,
    endCursor,
    hasNextPage,
  };
}

export async function loadMoreQueue(
  state: PhotoQueueState,
  minimum: number
): Promise<PhotoQueueState> {
  const membership = await getAlbumMembershipIndex();
  if (!state.hasNextPage || state.assets.length >= minimum) {
    return state;
  }

  let queue = state.assets;
  let endCursor = state.endCursor;
  let hasNextPage = state.hasNextPage;

  while (queue.length < minimum && hasNextPage) {
    const page = await fetchAssetsPage(endCursor, PAGE_SIZE);
    const looseAssets = page.assets.filter((asset) => !membership.has(asset.id));
    queue = queue.concat(looseAssets);
    endCursor = page.endCursor;
    hasNextPage = page.hasNextPage;
    if (page.assets.length === 0) {
      hasNextPage = false;
    }
  }

  return {
    assets: queue,
    endCursor,
    hasNextPage,
  };
}
