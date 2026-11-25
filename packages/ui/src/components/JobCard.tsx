import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';
import { CategoryChip, StatusBadge, type BadgeTone } from './StatusBadge';

/** Tarjeta de trabajo solo de presentación: recibe textos ya formateados, no conoce el dominio. */
export interface JobCardProps {
  categoryLabel: string;
  statusLabel?: string;
  statusTone?: BadgeTone;
  title: string;
  paymentLabel: string;
  dateLabel: string;
  timeLabel: string;
  neighborhood: string;
  /** Texto a la derecha del pie (por ejemplo, "3 postulantes"). */
  footerRight?: string;
  onPress?: () => void;
}

const { colors, radius, spacing, typography } = theme;

export function JobCard({
  categoryLabel,
  statusLabel,
  statusTone = 'neutral',
  title,
  paymentLabel,
  dateLabel,
  timeLabel,
  neighborhood,
  footerRight,
  onPress,
}: JobCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}. ${statusLabel ?? ''}. ${paymentLabel}. ${dateLabel}, ${timeLabel}. ${neighborhood}.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.badges}>
          <CategoryChip label={categoryLabel} />
          {statusLabel ? <StatusBadge label={statusLabel} tone={statusTone} /> : null}
        </View>
        <Text style={styles.payment}>{paymentLabel}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{dateLabel}</Text>
        <Text style={styles.metaText}>{timeLabel}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.metaText} numberOfLines={1}>
          {neighborhood}
        </Text>
        {footerRight ? <Text style={styles.footerRight}>{footerRight}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.surface,
    borderColor: colors.neutral.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[2],
    ...theme.shadows.sm,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[2] },
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] },
  payment: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.brand.primary },
  title: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.neutral.textPrimary },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
  },
  footerRight: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.brand.primary },
});
