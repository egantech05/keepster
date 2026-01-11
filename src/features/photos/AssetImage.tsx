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
  const [localState, setLocalState] = useState<{ id: string; uri: string | null }>({
    id: asset.id,
    uri: null,
  });
  const localUri = localState.id === asset.id ? localState.uri : null;

  useEffect(() => {
    let cancelled = false;
    if (localState.id !== asset.id) {
      setLocalState({ id: asset.id, uri: null });
    }

    const cached = uriCache.get(asset.id);
    if (cached) {
      setLocalState({ id: asset.id, uri: cached });
      return;
    }

    if (asset.uri && !asset.uri.startsWith('ph://')) {
      uriCache.set(asset.id, asset.uri);
      setLocalState({ id: asset.id, uri: asset.uri });
      return;
    }
    setLocalState({ id: asset.id, uri: null });

    MediaLibrary.getAssetInfoAsync(asset, { shouldDownloadFromNetwork: true })
      .then((info) => {
        const resolved = info.localUri ?? null;
        if (!cancelled && resolved) {
          uriCache.set(asset.id, resolved);
          setLocalState({ id: asset.id, uri: resolved });
        }
      })
      .catch((error) => {
        logger.warn('Asset info load failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.uri, localState.id]);

  const uri = useMemo(() => {
    if (localUri) return localUri;
    if (asset.uri && !asset.uri.startsWith('ph://')) {
      return asset.uri;
    }
    return null;
  }, [asset.uri, localUri]);

  return (
    <ExpoImage
      recyclingKey={asset.id}
      source={uri ? { uri } : undefined}
      style={style}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode === 'center' ? 'contain' : resizeMode}
    />
  );
}
