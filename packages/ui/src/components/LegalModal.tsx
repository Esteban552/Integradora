import React from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';
import { Button } from './Button';

export interface LegalModalProps {
  visible: boolean;
  title: string;
  /** Texto legal vigente. Lo entrega el equipo de documentación; no se redacta en código. */
  body: string;
  onClose: () => void;
}

const { colors, spacing, typography } = theme;

export function LegalModal({ visible, title, body, onClose }: LegalModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={8}>
            <Text style={styles.close}>Cerrar</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.text}>{body}</Text>
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Entendido" onPress={onClose} fullWidth />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  title: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.neutral.textPrimary },
  close: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.brand.primary },
  body: { padding: spacing[4] },
  text: { fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.sm, color: colors.neutral.textPrimary },
  footer: { padding: spacing[4], borderTopWidth: 1, borderTopColor: colors.neutral.border },
});
