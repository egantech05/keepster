import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { Album, Asset } from 'expo-media-library';
import { Button } from '../../components/Button';
import { ModalSheet } from '../../components/ModalSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { createAlbum, getOrderedAlbums, recordAlbumUsage } from './albumService';
import { logger } from '../../lib/logger';

type AlbumPickerModalProps = {
  visible: boolean;
  asset: Asset | null;
  onConfirm: (album: Album | null, assetAlreadyAdded: boolean) => void;
  onCancel: () => void;
};

export function AlbumPickerModal({ visible, asset, onConfirm, onCancel }: AlbumPickerModalProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [creating, setCreating] = useState(false);
  const [assetAlreadyAdded, setAssetAlreadyAdded] = useState(false);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedId) ?? null,
    [albums, selectedId]
  );

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const ordered = await getOrderedAlbums();
      setAlbums(ordered);
      setSelectedId(ordered[0]?.id ?? null);
    } catch (error) {
      logger.warn('Album load failed', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = newAlbumName.trim();
    if (!trimmed || !asset) return;
    setCreating(true);
    try {
      const album = await createAlbum(trimmed, asset);
      await recordAlbumUsage(album.id);
      const ordered = await getOrderedAlbums();
      setAlbums(ordered);
      setSelectedId(album.id);
      setAssetAlreadyAdded(true);
      setNewAlbumName('');
      setShowCreate(false);
    } catch (error) {
      logger.warn('Album create failed', error);
    } finally {
      setCreating(false);
    }
  }, [asset, newAlbumName]);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedAlbum, assetAlreadyAdded);
    setAssetAlreadyAdded(false);
  }, [assetAlreadyAdded, onConfirm, selectedAlbum]);

  useEffect(() => {
    if (visible) {
      loadAlbums();
      setAssetAlreadyAdded(false);
      setShowCreate(false);
      setNewAlbumName('');
    }
  }, [loadAlbums, visible]);

  return (
    <ModalSheet visible={visible} onRequestClose={onCancel}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose album</Text>
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>
      <View style={styles.pickerContainer}>
        {albums.length > 0 ? (
          <Picker
            selectedValue={selectedId}
            onValueChange={(value: string) => setSelectedId(value)}
            itemStyle={styles.pickerItem}
          >
            {albums.map((album) => (
              <Picker.Item key={album.id} label={album.title} value={album.id} />
            ))}
          </Picker>
        ) : (
          <Text style={styles.emptyText}>No albums yet</Text>
        )}
      </View>

      <View style={styles.createSection}>
        {!showCreate && (
          <Pressable onPress={() => setShowCreate(true)}>
            <Text style={styles.createLink}>+ New album</Text>
          </Pressable>
        )}
        {showCreate && (
          <View style={styles.createRow}>
            <TextInput
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              placeholder="Album name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <Button
              label={creating ? 'Creating' : 'Create'}
              onPress={handleCreate}
              disabled={creating || newAlbumName.trim().length === 0 || !asset}
              style={styles.createButton}
            />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button label="Cancel" onPress={onCancel} variant="ghost" />
        <Button label="Save" onPress={handleConfirm} disabled={!selectedAlbum} style={styles.actionButton} />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.titleFont,
    fontSize: 20,
    color: colors.textPrimary,
  },
  pickerContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  pickerItem: {
    fontFamily: typography.bodyFont,
    color: colors.textPrimary,
    fontSize: 16,
  },
  emptyText: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
    fontFamily: typography.bodyFont,
    color: colors.textMuted,
  },
  createSection: {
    marginBottom: spacing.lg,
  },
  createLink: {
    fontFamily: typography.bodyFont,
    color: colors.accent,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.bodyFont,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  createButton: {
    paddingHorizontal: spacing.md,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginLeft: spacing.sm,
  },
});
