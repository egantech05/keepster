import type { Asset } from 'expo-media-library';

export type BlurResult = {
  assetId: string;
  score: number | null;
  isBlurry: boolean | null;
};

export async function detectBlurryAssets(assets: Asset[]): Promise<BlurResult[]> {
  // Placeholder: true blur detection needs pixel access or heavy image processing.
  return assets.map((asset) => ({
    assetId: asset.id,
    score: null,
    isBlurry: null,
  }));
}
