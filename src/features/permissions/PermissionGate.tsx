import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ModalSheet } from '../../components/ModalSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { logger } from '../../lib/logger';
import { clearAlbumMembershipCache } from '../albums/albumMembershipService';
import {
  getPhotoPermissions,
  openSettings,
  presentPhotoPermissionsPicker,
  requestPhotoPermissions,
} from './permissionService';

type PermissionState = 'loading' | 'granted' | 'denied' | 'blocked';

type PermissionGateProps = {
  children: React.ReactNode;
};

export function PermissionGate({ children }: PermissionGateProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('loading');
  const [showLimitedPrompt, setShowLimitedPrompt] = useState(false);

  const refreshPermission = useCallback(async () => {
    const status = await getPhotoPermissions();
    logger.info('Permissions', status);
    if (status.granted) {
      setPermissionState('granted');
      setShowLimitedPrompt(status.accessPrivileges !== 'all');
      return;
    }
    if (status.canAskAgain) {
      setPermissionState('denied');
      return;
    }
    setPermissionState('blocked');
  }, []);

  const requestPermission = useCallback(async () => {
    const status = await requestPhotoPermissions();
    logger.info('Permissions', status);
    if (status.granted) {
      setPermissionState('granted');
      setShowLimitedPrompt(status.accessPrivileges !== 'all');
      return;
    }
    setPermissionState(status.canAskAgain ? 'denied' : 'blocked');
  }, []);

  const handleLimitedAccess = useCallback(async () => {
    try {
      await presentPhotoPermissionsPicker();
      clearAlbumMembershipCache();
      await refreshPermission();
      setShowLimitedPrompt(false);
    } catch (error) {
      logger.warn('Permission picker failed', error);
      setShowLimitedPrompt(false);
    }
  }, [refreshPermission]);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  if (permissionState === 'granted') {
    return (
      <>
        {children}
        <ModalSheet visible={showLimitedPrompt} onRequestClose={() => setShowLimitedPrompt(false)}>
          <Text style={styles.modalTitle}>Allow full photo access?</Text>
          <Text style={styles.modalBody}>
            Keepster needs full access to show every album. You can update this now.
          </Text>
          <View style={styles.modalActions}>
            <Button
              label="Not now"
              onPress={() => setShowLimitedPrompt(false)}
              variant="ghost"
            />
            <Button
              label="Allow full access"
              onPress={handleLimitedAccess}
              style={styles.modalButton}
            />
          </View>
        </ModalSheet>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keepster needs photo access</Text>
      <Text style={styles.body}>
        We only read your library to guide a calm cleaning session.
      </Text>
      {permissionState === 'loading' && (
        <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
      )}
      {permissionState === 'denied' && (
        <Button label="Allow Photos Access" onPress={requestPermission} />
      )}
      {permissionState === 'blocked' && (
        <Button label="Open Settings" onPress={openSettings} variant="ghost" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: typography.titleFont,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontFamily: typography.bodyFont,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.titleFont,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalBody: {
    fontFamily: typography.bodyFont,
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    marginLeft: spacing.sm,
  },
});
