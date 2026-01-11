import type { Album, Asset } from 'expo-media-library';
import { Platform } from 'react-native';
import { mediaLibraryAdapter } from '../photos/mediaLibraryAdapter';
import { markAssetInAlbum } from './albumMembershipService';
import { getRecentAlbumIds, pinRecentAlbums, recordRecentAlbum } from './recentAlbumsStore';

export async function getOrderedAlbums(): Promise<Album[]> {
  const [albums, recentIds] = await Promise.all([
    mediaLibraryAdapter.getAlbums(),
    getRecentAlbumIds(),
  ]);
  return pinRecentAlbums(albums, recentIds);
}

export async function createAlbum(name: string, asset?: Asset): Promise<Album> {
  if (!asset && Platform.OS !== 'ios') {
    throw new Error('Creating empty albums is only supported on iOS.');
  }
  const album = await mediaLibraryAdapter.createAlbum(name, asset);
  if (asset) {
    markAssetInAlbum(asset.id);
  }
  return album;
}

export async function addAssetToAlbum(asset: Asset, album: Album): Promise<void> {
  // iOS albums are collections; this adds without removing from Recents.
  await mediaLibraryAdapter.addAssetsToAlbum([asset], album);
  markAssetInAlbum(asset.id);
}

export async function recordAlbumUsage(albumId: string): Promise<void> {
  await recordRecentAlbum(albumId);
}
