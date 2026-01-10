import { Image } from 'react-native';
import type { Asset } from 'expo-media-library';
import * as MediaLibrary from 'expo-media-library';
import { mediaLibraryAdapter } from './mediaLibraryAdapter';

export type AssetsPage = {
  assets: Asset[];
  endCursor?: string;
  hasNextPage: boolean;
};

export async function fetchAssetsPage(after?: string, pageSize = 80): Promise<AssetsPage> {
  const response = await mediaLibraryAdapter.getAssets({
    first: pageSize,
    after,
    mediaType: ['photo'],
    sortBy: [MediaLibrary.SortBy.creationTime],
  });

  prefetchAssets(response.assets);

  return {
    assets: response.assets,
    endCursor: response.endCursor,
    hasNextPage: response.hasNextPage,
  };
}

export async function deleteAsset(asset: Asset): Promise<void> {
  await mediaLibraryAdapter.deleteAssets([asset.id]);
}

export async function deleteAssetsBatch(assetIds: string[]): Promise<void> {
  if (assetIds.length === 0) return;
  await mediaLibraryAdapter.deleteAssets(assetIds);
}

export function prefetchAssets(assets: Asset[], count = 6) {
  assets.slice(0, count).forEach((asset) => {
    if (asset.uri && !asset.uri.startsWith('ph://')) {
      Image.prefetch(asset.uri);
    }
  });
}
