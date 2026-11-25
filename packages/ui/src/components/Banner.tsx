import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export type BannerTone = 'error' | 'success' | 'info' | 'warning';

export interface BannerProps {
  tone: BannerTone;
  message: string;
}

const { colors, radius, spacing, typography } = theme;

const tones: Record<BannerTone, { bg: string; fg: string }> = {
  error: { bg: colors.semantic.dangerSoft, fg: colors.semantic.danger },
  success: { bg: colors.semantic.successSoft, fg: colors.semantic.success },
  info: { bg: colors.semantic.infoSoft, fg: colors.semantic.info },
  warning: { bg: colors.semantic.warningSoft, fg: colors.semantic.warning },
};

export function Banner({ tone, message }: BannerProps) {
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: spacing[3] },
  text: { fontSize: typography.fontSize.sm, fontWeight: '500' },
});
