import type { Album } from 'expo-media-library';
import { pinRecentAlbums, recordRecentAlbum, getRecentAlbumIds } from './recentAlbumsStore';

const storage = { data: {} as Record<string, unknown> };

jest.mock('../../lib/storage', () => ({
  getStoredValue: async (key: string, fallback: unknown) => {
    return key in storage.data ? storage.data[key] : fallback;
  },
  setStoredValue: async (key: string, value: unknown) => {
    storage.data[key] = value;
  },
}));

const makeAlbum = (id: string, title: string): Album => ({
  id,
  title,
  assetCount: 0,
  type: 'album',
});

describe('recentAlbumsStore', () => {
  beforeEach(() => {
    storage.data = {};
  });

  it('pins the most recent albums to the top', () => {
    const albums = [makeAlbum('a', 'A'), makeAlbum('b', 'B'), makeAlbum('c', 'C')];
    const result = pinRecentAlbums(albums, ['c', 'a']);
    expect(result.map((album) => album.id)).toEqual(['c', 'a', 'b']);
  });

  it('moves selected album to the front and keeps order', async () => {
    storage.data['keepster.recentAlbums.v1'] = ['a', 'b', 'c'];
    const next = await recordRecentAlbum('b');
    expect(next).toEqual(['b', 'a', 'c']);
    const stored = await getRecentAlbumIds();
    expect(stored).toEqual(['b', 'a', 'c']);
  });
});
