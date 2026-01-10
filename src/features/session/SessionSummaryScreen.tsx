import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useSessionStore } from './sessionStore';
import { formatDuration } from '../../lib/time';

type SessionSummaryScreenProps = {
  onStartAnother: () => void;
  onBackHome: () => void;
};

export function SessionSummaryScreen({ onStartAnother, onBackHome }: SessionSummaryScreenProps) {
  const { state } = useSessionStore();

  const duration = useMemo(() => {
    if (!state.startedAt || !state.endedAt) return '0m 0s';
    return formatDuration(state.endedAt - state.startedAt);
  }, [state.endedAt, state.startedAt]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session complete</Text>
      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Kept</Text>
          <Text style={styles.value}>{state.keptCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Deleted</Text>
          <Text style={styles.value}>{state.deletedCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{duration}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Start another session" onPress={onStartAnother} />
        <Button label="Back to home" onPress={onBackHome} variant="ghost" style={styles.secondaryButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: typography.titleFont,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.bodyFont,
    fontSize: 16,
    color: colors.textMuted,
  },
  value: {
    fontFamily: typography.titleFont,
    fontSize: 16,
    color: colors.textPrimary,
  },
  actions: {
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
});
