import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface TextFieldProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'placeholder'
    | 'keyboardType'
    | 'autoCapitalize'
    | 'autoComplete'
    | 'textContentType'
    | 'secureTextEntry'
    | 'maxLength'
    | 'returnKeyType'
    | 'onSubmitEditing'
    | 'blurOnSubmit'
    | 'editable'
    | 'multiline'
    | 'numberOfLines'
  > {
  label: string;
  error?: string | null;
  helperText?: string;
  rightAccessory?: React.ReactNode;
}

const { colors, radius, spacing, typography } = theme;

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helperText, rightAccessory, editable = true, ...inputProps },
  ref
) {
  const hasError = Boolean(error);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, hasError && styles.boxError, !editable && styles.boxDisabled]}>
        <TextInput
          ref={ref}
          style={[styles.input, inputProps.multiline && styles.inputMultiline]}
          textAlignVertical={inputProps.multiline ? 'top' : 'center'}
          placeholderTextColor={colors.neutral.textMuted}
          accessibilityLabel={label}
          editable={editable}
          {...inputProps}
        />
        {rightAccessory}
      </View>
      {hasError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.neutral.textPrimary },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radius.md,
    backgroundColor: colors.neutral.surface,
    paddingHorizontal: spacing[3],
  },
  boxError: { borderColor: colors.semantic.danger },
  boxDisabled: { backgroundColor: colors.neutral.surfaceMuted },
  input: { flex: 1, fontSize: typography.fontSize.md, color: colors.neutral.textPrimary, paddingVertical: spacing[2] },
  inputMultiline: { minHeight: 96, paddingTop: spacing[2] },
  error: { fontSize: typography.fontSize.xs, color: colors.semantic.danger },
  helper: { fontSize: typography.fontSize.xs, color: colors.neutral.textSecondary },
});
