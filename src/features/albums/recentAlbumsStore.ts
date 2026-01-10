import type { Album } from 'expo-media-library';
import { getStoredValue, setStoredValue } from '../../lib/storage';

const STORAGE_KEY = 'keepster.recentAlbums.v1';
const MAX_RECENT = 8;

export async function getRecentAlbumIds(): Promise<string[]> {
  return getStoredValue<string[]>(STORAGE_KEY, []);
}

export async function recordRecentAlbum(albumId: string): Promise<string[]> {
  const current = await getRecentAlbumIds();
  const next = [albumId, ...current.filter((id) => id !== albumId)].slice(0, MAX_RECENT);
  await setStoredValue(STORAGE_KEY, next);
  return next;
}

export function pinRecentAlbums(albums: Album[], recentIds: string[]): Album[] {
  if (recentIds.length === 0) return albums;
  const byId = new Map(albums.map((album) => [album.id, album]));
  const pinned = recentIds.map((id) => byId.get(id)).filter(Boolean) as Album[];
  const pinnedIds = new Set(pinned.map((album) => album.id));
  const rest = albums.filter((album) => !pinnedIds.has(album.id));
  return [...pinned, ...rest];
}
