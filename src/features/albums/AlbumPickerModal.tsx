import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Album } from 'expo-media-library';
import * as MediaLibrary from 'expo-media-library';
import { Button } from '../../components/Button';
import { ModalSheet } from '../../components/ModalSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { createAlbum, getOrderedAlbums } from './albumService';
import { logger } from '../../lib/logger';
import { clearAlbumMembershipCache } from './albumMembershipService';
import { AlbumWheel } from './AlbumWheel';

type AlbumPickerModalProps = {
  visible: boolean;
  onConfirm: (album: Album | null) => void;
  onCancel: () => void;
};

export function AlbumPickerModal({ visible, onConfirm, onCancel }: AlbumPickerModalProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [creating, setCreating] = useState(false);
  const [accessPrivileges, setAccessPrivileges] = useState<
    MediaLibrary.PermissionResponse['accessPrivileges']
  >(undefined);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedId) ?? null,
    [albums, selectedId]
  );

  const getAlbumLabel = useCallback((album: Album | null) => {
    if (!album) return 'Select an album';
    const rawTitle = (album.title ?? '').trim();
    if (rawTitle && rawTitle !== '?' && !/^[?\uFFFD]+$/.test(rawTitle)) {
      return rawTitle;
    }
    return `Album ${album.id.slice(-4)}`;
  }, []);

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const ordered = await getOrderedAlbums();
      logger.info('Albums', ordered.map((album) => ({ id: album.id, title: album.title })));
      setAlbums(ordered);
      setSelectedId(ordered[0]?.id ?? null);
    } catch (error) {
      logger.warn('Album load failed', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      const status = await MediaLibrary.getPermissionsAsync();
      setAccessPrivileges(status.accessPrivileges);
    } catch (error) {
      logger.warn('Permission load failed', error);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmed = newAlbumName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const album = await createAlbum(trimmed);
      setAlbums((prev) => {
        const next = [album, ...prev.filter((item) => item.id !== album.id)];
        return next;
      });
      setSelectedId(album.id);
      setNewAlbumName('');
      setShowCreate(false);
    } catch (error) {
      logger.warn('Album create failed', error);
    } finally {
      setCreating(false);
    }
  }, [newAlbumName]);

  const handleConfirm = useCallback(() => {
    onConfirm(selectedAlbum);
  }, [onConfirm, selectedAlbum]);

  const handleManageAccess = useCallback(async () => {
    try {
      await MediaLibrary.presentPermissionsPickerAsync(['photo']);
      clearAlbumMembershipCache();
      await loadPermissions();
      await loadAlbums();
    } catch (error) {
      logger.warn('Permission picker failed', error);
    }
  }, [loadAlbums, loadPermissions]);

  useEffect(() => {
    if (visible) {
      loadAlbums();
      loadPermissions();
      setShowCreate(false);
      setNewAlbumName('');
    }
  }, [loadAlbums, loadPermissions, visible]);

  return (
    <ModalSheet visible={visible} onRequestClose={onCancel}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose album</Text>
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>
      <View style={styles.pickerContainer}>
        <Text style={styles.selectedLabel}>
          {getAlbumLabel(selectedAlbum)}
        </Text>
        {accessPrivileges === 'limited' && (
          <View style={styles.accessRow}>
            <Text style={styles.accessText}>Limited access</Text>
            <Pressable onPress={handleManageAccess}>
              <Text style={styles.accessLink}>Manage access</Text>
            </Pressable>
          </View>
        )}
        {albums.length > 0 ? (
          <AlbumWheel
            albums={albums}
            selectedId={selectedId ?? albums[0]?.id ?? null}
            onChange={setSelectedId}
            getLabel={getAlbumLabel}
          />
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
              disabled={creating || newAlbumName.trim().length === 0}
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
    borderWidth: 1,
    borderColor: colors.divider,
  },
  selectedLabel: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.textBright,
    marginBottom: spacing.sm,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accessText: {
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  accessLink: {
    color: colors.accentSoft,
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
