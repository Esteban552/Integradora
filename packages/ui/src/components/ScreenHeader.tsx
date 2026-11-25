import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Acción a la derecha del título (por ejemplo, un botón Crear). */
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.wrap}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] },
  wrap: { flex: 1, gap: theme.spacing[1] },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: '700', color: theme.colors.neutral.textPrimary },
  subtitle: { fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral.textSecondary },
});
