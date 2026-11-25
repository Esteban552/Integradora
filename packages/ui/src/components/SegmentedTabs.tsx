import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface TabOption<T extends string> {
  id: T;
  label: string;
}

export interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
}

const { colors, radius, spacing, typography } = theme;

export function SegmentedTabs<T extends string>({ options, activeId, onChange }: SegmentedTabsProps<T>) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.id === activeId;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing[1],
  },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.neutral.surface, ...theme.shadows.sm },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.neutral.textSecondary },
  labelActive: { color: colors.brand.primary },
});
