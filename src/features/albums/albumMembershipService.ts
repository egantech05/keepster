import * as MediaLibrary from 'expo-media-library';
import { logger } from '../../lib/logger';
import { mediaLibraryAdapter } from '../photos/mediaLibraryAdapter';

const PAGE_SIZE = 200;

let membershipCache: Set<string> | null = null;
let membershipPromise: Promise<Set<string>> | null = null;

async function buildMembershipIndex(): Promise<Set<string>> {
  const albums = await mediaLibraryAdapter.getAlbums(false);
  const membership = new Set<string>();

  for (const album of albums) {
    let hasNextPage = true;
    let endCursor: string | undefined;

    while (hasNextPage) {
      const page = await mediaLibraryAdapter.getAssets({
        first: PAGE_SIZE,
        after: endCursor,
        album: album.id,
        mediaType: ['photo'],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      page.assets.forEach((asset) => membership.add(asset.id));
      endCursor = page.endCursor;
      hasNextPage = page.hasNextPage;
    }
  }

  return membership;
}

export async function getAlbumMembershipIndex(): Promise<Set<string>> {
  if (membershipCache) return membershipCache;
  if (!membershipPromise) {
    membershipPromise = buildMembershipIndex()
      .then((result) => {
        membershipCache = result;
        return result;
      })
      .catch((error) => {
        logger.warn('Album membership build failed', error);
        membershipCache = new Set<string>();
        return membershipCache;
      })
      .finally(() => {
        membershipPromise = null;
      });
  }
  return membershipPromise;
}

export function markAssetInAlbum(assetId: string) {
  if (!membershipCache) return;
  membershipCache.add(assetId);
}

export function clearAlbumMembershipCache() {
  membershipCache = null;
  membershipPromise = null;
}
