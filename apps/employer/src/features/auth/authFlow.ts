import { authService, type Profile } from '@trabajos/services';
import { authErrorMessage, errorCode } from './errors';
import { LEGAL_VERSION } from './legal';
import { birthToIso, type RegisterValues } from './validation';

export type FlowResult<T> = { ok: true; value: T } | { ok: false; error: string; code: string | null };

function fail<T>(err: unknown): FlowResult<T> {
  return { ok: false, error: authErrorMessage(err), code: errorCode(err) };
}

/** Alta en Supabase Auth. El perfil se crea después, en el primer inicio de sesión con correo verificado. */
export async function registerEmployer(v: RegisterValues): Promise<FlowResult<'verification_required'>> {
  const birthDate = birthToIso(v.birthDate);
  if (!birthDate) return { ok: false, error: 'Fecha de nacimiento no válida.', code: null };
  try {
    const r = await authService.signUp({
      email: v.email.trim(),
      password: v.password,
      role: 'employer',
      fullName: v.fullName.trim(),
      phone: v.phone.trim(),
      birthDate,
    });
    return { ok: true, value: r.status };
  } catch (err) {
    return fail(err);
  }
}

/**
 * Inicio de sesión. Si es el primer acceso (sin fila en profiles) crea el perfil y registra
 * la aceptación de Términos y Privacidad. Rechaza cuentas que no sean de Empleador.
 */
export async function loginEmployer(email: string, password: string): Promise<FlowResult<Profile>> {
  try {
    const session = await authService.signIn({ email: email.trim(), password });
    if (session.needsProfile) {
      if (!session.pendingProfile) return { ok: false, error: 'No se encontraron tus datos de registro.', code: null };
      if (session.pendingProfile.role !== 'employer') {
        await authService.signOut();
        return { ok: false, error: authErrorMessage('ERR_WRONG_APP'), code: 'ERR_WRONG_APP' };
      }
      await authService.completeProfile(session.pendingProfile);
      await authService.acceptTerms('terms', LEGAL_VERSION);
      await authService.acceptTerms('privacy', LEGAL_VERSION);
    }
    const profile = session.profile ?? (await authService.getProfileById(session.userId));
    if (!profile) return { ok: false, error: 'No se pudo cargar tu perfil.', code: null };
    if (profile.role !== 'employer') {
      await authService.signOut();
      return { ok: false, error: authErrorMessage('ERR_WRONG_APP'), code: 'ERR_WRONG_APP' };
    }
    if (profile.account_status === 'blocked' || profile.account_status === 'soft_deleted') {
      await authService.signOut();
      return { ok: false, error: authErrorMessage('ERR_ACCOUNT_RESTRICTED'), code: 'ERR_ACCOUNT_RESTRICTED' };
    }
    return { ok: true, value: profile };
  } catch (err) {
    return fail(err);
  }
}

export async function resendVerification(email: string): Promise<FlowResult<true>> {
  try {
    await authService.resendVerification(email.trim());
    return { ok: true, value: true };
  } catch (err) {
    return fail(err);
  }
}
