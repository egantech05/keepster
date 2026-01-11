import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import type { Album } from 'expo-media-library';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

type AlbumWheelProps = {
  albums: Album[];
  selectedId: string | null;
  onChange: (albumId: string) => void;
  getLabel: (album: Album | null) => string;
};

export function AlbumWheel({ albums, selectedId, onChange, getLabel }: AlbumWheelProps) {
  const listRef = useRef<FlatList<Album>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const selectedIndex = useMemo(() => {
    const index = albums.findIndex((album) => album.id === selectedId);
    return index >= 0 ? index : 0;
  }, [albums, selectedId]);

  useEffect(() => {
    if (!albums.length) return;
    listRef.current?.scrollToOffset({
      offset: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [albums.length, selectedIndex]);

  const handleScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const album = albums[index];
      if (album && album.id !== selectedId) {
        onChange(album.id);
      }
    },
    [albums, onChange, selectedId]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Album; index: number }) => {
      const inputRange = [
        (index - 2) * ITEM_HEIGHT,
        (index - 1) * ITEM_HEIGHT,
        index * ITEM_HEIGHT,
        (index + 1) * ITEM_HEIGHT,
        (index + 2) * ITEM_HEIGHT,
      ];
      const scale = scrollY.interpolate({
        inputRange,
        outputRange: [0.86, 0.92, 1, 0.92, 0.86],
        extrapolate: 'clamp',
      });
      const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0.35, 0.6, 1, 0.6, 0.35],
        extrapolate: 'clamp',
      });

      return (
        <View style={styles.item}>
          <Animated.Text
            style={[styles.itemText, { opacity, transform: [{ scale }] }]}
            numberOfLines={1}
          >
            {getLabel(item)}
          </Animated.Text>
        </View>
      );
    },
    [getLabel, scrollY]
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={listRef}
        data={albums}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={styles.content}
      />
      <View pointerEvents="none" style={styles.selection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WHEEL_HEIGHT,
    overflow: 'hidden',
    borderRadius: 16,
  },
  content: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  itemText: {
    fontFamily: typography.bodyFont,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textBright,
    textAlign: 'center',
  },
  selection: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(30, 22, 42, 0.35)',
  },
});
