import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neutral.surface,
    borderColor: theme.colors.neutral.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    ...theme.shadows.sm,
  },
});
