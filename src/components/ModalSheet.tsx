import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type ModalSheetProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
};

export function ModalSheet({ visible, onRequestClose, children }: ModalSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 12,
    elevation: 6,
  },
});
