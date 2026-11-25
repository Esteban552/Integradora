import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native';
import type { Profile } from '@trabajos/services';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  LegalModal,
  PasswordField,
  ScreenHeader,
  SegmentedTabs,
  TextField,
} from '@trabajos/ui';
import { theme } from '../../../theme';
import { loginEmployer, registerEmployer, resendVerification } from '../authFlow';
import { LEGAL_BODIES, LEGAL_TITLES } from '../legal';
import {
  maskBirthInput,
  passwordChecks,
  validateLogin,
  validateRegister,
  type Issues,
  type LoginField,
  type RegisterField,
  type RegisterValues,
} from '../validation';
import type { LegalDocument } from '@trabajos/services';

type Mode = 'register' | 'login' | 'verify_email';

const RESEND_COOLDOWN_S = 60;

export interface EmployerAuthScreenProps {
  /** Se llama cuando el empleador inicia sesión con éxito (navegar a UI-EMP-02). */
  onAuthenticated: (profile: Profile) => void;
}

const emptyRegister: RegisterValues = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  birthDate: '',
  acceptTerms: false,
  acceptPrivacy: false,
};

/** UI-EMP-01 — Registro e inicio de sesión del Empleador (RF-01, RF-03, D-09). */
export function EmployerAuthScreen({ onAuthenticated }: EmployerAuthScreenProps) {
  const [mode, setMode] = useState<Mode>('register');
  const [reg, setReg] = useState<RegisterValues>(emptyRegister);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regIssues, setRegIssues] = useState<Issues<RegisterField>>({});
  const [loginIssues, setLoginIssues] = useState<Issues<LoginField>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null);
  const [cooldown, setCooldown] = useState(0);
  // Credenciales del registro, para "Ya confirmé mi correo" sin pedirlas otra vez.
  const pendingCreds = useRef<{ email: string; password: string } | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const birthRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setField = <K extends keyof RegisterValues>(key: K, value: RegisterValues[K]) => {
    const next = { ...reg, [key]: value };
    setReg(next);
    if (submitted) setRegIssues(validateRegister(next));
  };

  const changeMode = (m: 'register' | 'login') => {
    setMode(m);
    setFormError(null);
    setNotice(null);
    setSubmitted(false);
    setRegIssues({});
    setLoginIssues({});
  };

  const handleRegister = async () => {
    if (busy) return;
    setSubmitted(true);
    setFormError(null);
    const issues = validateRegister(reg);
    setRegIssues(issues);
    if (Object.keys(issues).length > 0) return;
    setBusy(true);
    const r = await registerEmployer(reg);
    setBusy(false);
    if (!r.ok) {
      setFormError(r.error);
      return;
    }
    pendingCreds.current = { email: reg.email.trim(), password: reg.password };
    setCooldown(RESEND_COOLDOWN_S);
    setMode('verify_email');
  };

  const doLogin = async (email: string, password: string) => {
    setBusy(true);
    const r = await loginEmployer(email, password);
    setBusy(false);
    if (!r.ok) {
      setFormError(r.error);
      return;
    }
    pendingCreds.current = null;
    onAuthenticated(r.value);
  };

  const handleLogin = async () => {
    if (busy) return;
    setSubmitted(true);
    setFormError(null);
    const issues = validateLogin(loginEmail, loginPassword);
    setLoginIssues(issues);
    if (Object.keys(issues).length > 0) return;
    await doLogin(loginEmail, loginPassword);
  };

  const handleConfirmed = async () => {
    if (busy || !pendingCreds.current) return;
    setFormError(null);
    setNotice(null);
    await doLogin(pendingCreds.current.email, pendingCreds.current.password);
  };

  const handleResend = async () => {
    if (busy || cooldown > 0 || !pendingCreds.current) return;
    setBusy(true);
    const r = await resendVerification(pendingCreds.current.email);
    setBusy(false);
    if (!r.ok) {
      setFormError(r.error);
      return;
    }
    setFormError(null);
    setNotice('Te enviamos el correo de nuevo.');
    setCooldown(RESEND_COOLDOWN_S);
  };

  const showErr = <T extends string>(issues: Issues<T>, key: T) => (submitted ? issues[key] : undefined);

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Acceso Empleador"
            subtitle="Publica trabajos temporales y contrata con pago protegido."
          />

          {mode !== 'verify_email' && (
            <SegmentedTabs
              activeId={mode}
              onChange={changeMode}
              options={[
                { id: 'register', label: 'Crear cuenta' },
                { id: 'login', label: 'Iniciar sesión' },
              ]}
            />
          )}

          {formError ? <Banner tone="error" message={formError} /> : null}
          {notice ? <Banner tone="success" message={notice} /> : null}

          {mode === 'verify_email' && (
            <Card style={styles.cardGap}>
              <Text style={styles.verifyTitle} accessibilityRole="header">
                Revisa tu correo
              </Text>
              <Text style={styles.verifyText}>
                Enviamos un enlace de confirmación a {pendingCreds.current?.email}. Al confirmarlo podrás
                publicar trabajos temporales.
              </Text>
              <Button title="Ya confirmé mi correo" onPress={handleConfirmed} loading={busy} fullWidth />
              <Button
                title={cooldown > 0 ? `Reenviar correo (${cooldown} s)` : 'Reenviar correo'}
                variant="secondary"
                onPress={handleResend}
                disabled={cooldown > 0}
                fullWidth
              />
              <Button title="Usar otro correo" variant="ghost" onPress={() => changeMode('register')} fullWidth />
            </Card>
          )}

          {mode === 'login' && (
            <Card style={styles.cardGap}>
              <TextField
                label="Correo electrónico"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                blurOnSubmit={false}
                error={showErr(loginIssues, 'email')}
              />
              <PasswordField
                ref={passRef}
                label="Contraseña"
                value={loginPassword}
                onChangeText={setLoginPassword}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={showErr(loginIssues, 'password')}
              />
              <Button title="Entrar" onPress={handleLogin} loading={busy} fullWidth />
            </Card>
          )}

          {mode === 'register' && (
            <Card style={styles.cardGap}>
              <TextField
                label="Nombre o razón comercial"
                value={reg.fullName}
                onChangeText={(t) => setField('fullName', t)}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
                error={showErr(regIssues, 'fullName')}
              />
              <TextField
                ref={emailRef}
                label="Correo electrónico"
                value={reg.email}
                onChangeText={(t) => setField('email', t)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                blurOnSubmit={false}
                error={showErr(regIssues, 'email')}
              />
              <PasswordField
                ref={passRef}
                label="Contraseña"
                value={reg.password}
                onChangeText={(t) => setField('password', t)}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
                rules={passwordChecks(reg.password)}
                error={showErr(regIssues, 'password')}
              />
              <TextField
                ref={phoneRef}
                label="Teléfono de contacto"
                value={reg.phone}
                onChangeText={(t) => setField('phone', t)}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={20}
                returnKeyType="next"
                onSubmitEditing={() => birthRef.current?.focus()}
                blurOnSubmit={false}
                helperText="Sin verificación por SMS. Solo lo verá el trabajador que selecciones."
                error={showErr(regIssues, 'phone')}
              />
              <TextField
                ref={birthRef}
                label="Fecha de nacimiento (DD/MM/AAAA)"
                value={reg.birthDate}
                onChangeText={(t) => setField('birthDate', maskBirthInput(t))}
                keyboardType="number-pad"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                returnKeyType="done"
                helperText="Debes ser mayor de 18 años."
                error={showErr(regIssues, 'birthDate')}
              />

              <View style={styles.legal}>
                <Checkbox
                  checked={reg.acceptTerms}
                  onChange={(v) => setField('acceptTerms', v)}
                  accessibilityLabel="Aceptar los Términos de Uso"
                >
                  <Text style={styles.legalText}>
                    Acepto los{' '}
                    <Text style={styles.link} onPress={() => setLegalDoc('terms')} accessibilityRole="link">
                      Términos de Uso
                    </Text>
                  </Text>
                </Checkbox>
                <Checkbox
                  checked={reg.acceptPrivacy}
                  onChange={(v) => setField('acceptPrivacy', v)}
                  accessibilityLabel="Aceptar el Aviso de Privacidad"
                >
                  <Text style={styles.legalText}>
                    Acepto el{' '}
                    <Text style={styles.link} onPress={() => setLegalDoc('privacy')} accessibilityRole="link">
                      Aviso de Privacidad
                    </Text>
                  </Text>
                </Checkbox>
                {showErr(regIssues, 'terms') ? <Text style={styles.error}>{regIssues.terms}</Text> : null}
              </View>

              <Button title="Crear cuenta de Empleador" onPress={handleRegister} loading={busy} fullWidth />
              <Pressable onPress={() => changeMode('login')} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.switchText}>¿Ya tienes cuenta? Inicia sesión</Text>
              </Pressable>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <LegalModal
        visible={legalDoc !== null}
        title={legalDoc ? LEGAL_TITLES[legalDoc] : ''}
        body={legalDoc ? LEGAL_BODIES[legalDoc] : ''}
        onClose={() => setLegalDoc(null)}
      />
    </SafeAreaView>
  );
}

const { colors, spacing, typography } = theme;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.background },
  flex: { flex: 1 },
  content: { padding: spacing[4], gap: spacing[4] },
  cardGap: { gap: spacing[4] },
  legal: { gap: spacing[3], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.neutral.border },
  legalText: { fontSize: typography.fontSize.sm, color: colors.neutral.textPrimary },
  link: { color: colors.brand.primary, fontWeight: '600', textDecorationLine: 'underline' },
  error: { fontSize: typography.fontSize.xs, color: colors.semantic.danger },
  switchText: { textAlign: 'center', fontSize: typography.fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  verifyTitle: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.neutral.textPrimary },
  verifyText: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
});
