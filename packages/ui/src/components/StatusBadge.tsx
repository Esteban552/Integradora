import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';

export interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
}

const { colors, radius, spacing, typography } = theme;

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: colors.semantic.successSoft, fg: colors.semantic.success },
  warning: { bg: colors.semantic.warningSoft, fg: colors.semantic.warning },
  error: { bg: colors.semantic.dangerSoft, fg: colors.semantic.danger },
  info: { bg: colors.semantic.infoSoft, fg: colors.semantic.info },
  neutral: { bg: colors.neutral.surfaceMuted, fg: colors.neutral.textSecondary },
  purple: {
    bg: theme.design.colors.semantic.purple.bg,
    fg: theme.design.colors.semantic.purple.text,
  },
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <View style={[styles.dot, { backgroundColor: t.fg }]} />
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export interface CategoryChipProps {
  label: string;
}

export function CategoryChip({ label }: CategoryChipProps) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.brand.secondarySoft }]}>
      <Text style={[styles.text, { color: colors.brand.secondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: typography.fontSize.xs, fontWeight: '600' },
});
