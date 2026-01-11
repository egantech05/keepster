import * as MediaLibrary from 'expo-media-library';
import type { Album, Asset } from 'expo-media-library';

export type AssetsResponse = MediaLibrary.PagedInfo<Asset>;

export const mediaLibraryAdapter = {
  getAssets: (params: MediaLibrary.AssetsOptions): Promise<AssetsResponse> => {
    return MediaLibrary.getAssetsAsync(params);
  },
  getAlbums: (includeSmartAlbums = false): Promise<Album[]> => {
    return MediaLibrary.getAlbumsAsync({ includeSmartAlbums });
  },
  createAlbum: (name: string, asset?: Asset): Promise<Album> => {
    if (asset) {
      return MediaLibrary.createAlbumAsync(name, asset);
    }
    return MediaLibrary.createAlbumAsync(name);
  },
  addAssetsToAlbum: (assets: Asset[], album: Album): Promise<void> => {
    return MediaLibrary.addAssetsToAlbumAsync(assets, album, false);
  },
  deleteAssets: (assetIds: string[]): Promise<void> => {
    return MediaLibrary.deleteAssetsAsync(assetIds);
  },
};
