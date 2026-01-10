import type { Asset } from 'expo-media-library';

export type DuplicateGroup = {
  key: string;
  assets: Asset[];
};

export function detectDuplicateGroups(assets: Asset[]): DuplicateGroup[] {
  const groups = new Map<string, Asset[]>();

  assets.forEach((asset) => {
    const key = `${asset.creationTime}-${asset.width}-${asset.height}-${asset.filename ?? ''}`;
    const existing = groups.get(key) ?? [];
    existing.push(asset);
    groups.set(key, existing);
  });

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, assets: group }));
}

export async function refineDuplicateGroups(
  groups: DuplicateGroup[]
): Promise<DuplicateGroup[]> {
  // Stage 2 hashing would go here; iOS photo library metadata access is limited.
  return groups;
}
