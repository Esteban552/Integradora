import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

const { colors, radius, spacing, typography } = theme;

const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand.primary, fg: colors.neutral.textInverse, border: colors.brand.primary },
  secondary: { bg: colors.neutral.surface, fg: colors.brand.primary, border: colors.brand.primary },
  ghost: { bg: 'transparent', fg: colors.brand.primary, border: 'transparent' },
  danger: { bg: colors.semantic.danger, fg: colors.neutral.textInverse, border: colors.semantic.danger },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border },
        fullWidth && styles.full,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={p.fg} style={styles.spinner} /> : null}
        <Text style={[styles.label, { color: p.fg }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // objetivo táctil mínimo
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginRight: spacing[2] },
  label: { fontSize: typography.fontSize.md, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
