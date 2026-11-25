import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';
import { Button } from './Button';

const { colors, spacing, typography } = theme;

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{description}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.title}>No se pudo cargar</Text>
      <Text style={styles.text}>{message}</Text>
      <Button title="Reintentar" variant="secondary" onPress={onRetry} />
    </View>
  );
}

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.brand.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing[3], paddingVertical: spacing[10], paddingHorizontal: spacing[4] },
  title: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.neutral.textPrimary, textAlign: 'center' },
  text: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary, textAlign: 'center' },
});
