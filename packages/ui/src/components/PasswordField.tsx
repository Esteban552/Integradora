import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';
import { TextField, type TextFieldProps } from './TextField';

export interface PasswordRule {
  label: string;
  ok: boolean;
}

export interface PasswordFieldProps extends Omit<TextFieldProps, 'secureTextEntry' | 'rightAccessory'> {
  /** Si se pasa, se muestra el checklist de política de contraseña en vivo. */
  rules?: PasswordRule[];
}

const { colors, spacing, typography } = theme;

export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(function PasswordField(
  { rules, ...fieldProps },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.wrap}>
      <TextField
        ref={ref}
        {...fieldProps}
        secureTextEntry={!visible}
        autoCapitalize="none"
        rightAccessory={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
          >
            <Text style={styles.toggle}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        }
      />
      {rules ? (
        <View style={styles.rules}>
          {rules.map((r) => (
            <Text key={r.label} style={[styles.rule, r.ok ? styles.ruleOk : styles.rulePending]}>
              {r.ok ? '[ok]' : '[  ]'} {r.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  toggle: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.brand.primary },
  rules: { gap: 2 },
  rule: { fontSize: typography.fontSize.xs },
  ruleOk: { color: colors.semantic.success },
  rulePending: { color: colors.neutral.textSecondary },
});
