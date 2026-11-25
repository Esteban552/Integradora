import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Contenido de la etiqueta (puede incluir enlaces). */
  children: React.ReactNode;
  accessibilityLabel: string;
}

const { colors, radius, spacing } = theme;

export function Checkbox({ checked, onChange, children, accessibilityLabel }: CheckboxProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked }}
        hitSlop={8}
        style={[styles.box, checked && styles.boxChecked]}
      >
        {checked ? <View style={styles.dot} /> : null}
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.neutral.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.surface,
  },
  boxChecked: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary },
  dot: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.neutral.textInverse },
  label: { flex: 1, paddingTop: 2 },
});
