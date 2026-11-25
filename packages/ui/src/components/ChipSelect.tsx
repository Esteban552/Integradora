import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface ChipOption<T extends string> {
  id: T;
  label: string;
}

export interface ChipSelectProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  value: T | null;
  onChange: (id: T) => void;
  error?: string | null;
}

const { colors, radius, spacing, typography } = theme;

/** Selección única con chips que saltan de línea (categorías, fechas rápidas). */
export function ChipSelect<T extends string>({ label, options, value, onChange, error }: ChipSelectProps<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.neutral.textPrimary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.neutral.surface,
  },
  chipActive: { backgroundColor: colors.brand.primarySoft, borderColor: colors.brand.primary },
  chipText: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  chipTextActive: { color: colors.brand.primary, fontWeight: '600' },
  error: { fontSize: typography.fontSize.xs, color: colors.semantic.danger },
});
