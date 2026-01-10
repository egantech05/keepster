import React, { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ImageStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import type { Asset } from 'expo-media-library';
import { logger } from '../../lib/logger';

type AssetImageProps = {
  asset: Asset;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
};

const uriCache = new Map<string, string>();

export function AssetImage({ asset, style, resizeMode = 'cover' }: AssetImageProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = uriCache.get(asset.id);
    if (cached) {
      setLocalUri(cached);
      return;
    }

    if (asset.uri && !asset.uri.startsWith('ph://')) {
      uriCache.set(asset.id, asset.uri);
      setLocalUri(asset.uri);
      return;
    }

    setLocalUri(null);

    MediaLibrary.getAssetInfoAsync(asset, { shouldDownloadFromNetwork: true })
      .then((info) => {
        const resolved = info.localUri ?? null;
        if (!cancelled && resolved) {
          uriCache.set(asset.id, resolved);
          setLocalUri(resolved);
        }
      })
      .catch((error) => {
        logger.warn('Asset info load failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.uri]);

  const uri = useMemo(() => localUri ?? asset.uri, [asset.uri, localUri]);

  return (
    <ExpoImage
      source={uri ? { uri } : undefined}
      style={style}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode === 'center' ? 'contain' : resizeMode}
    />
  );
}
