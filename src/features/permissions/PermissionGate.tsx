import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getPhotoPermissions, openSettings, requestPhotoPermissions } from './permissionService';

type PermissionState = 'loading' | 'granted' | 'denied' | 'blocked';

type PermissionGateProps = {
  children: React.ReactNode;
};

export function PermissionGate({ children }: PermissionGateProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('loading');

  const refreshPermission = useCallback(async () => {
    const status = await getPhotoPermissions();
    if (status.granted) {
      setPermissionState('granted');
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
    if (status.granted) {
      setPermissionState('granted');
      return;
    }
    setPermissionState(status.canAskAgain ? 'denied' : 'blocked');
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  if (permissionState === 'granted') {
    return <>{children}</>;
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
});
