import { callRpc, getServiceConfig } from '../config';
import profilesMock from '../mocks/profiles.json';
import type { LegalDocument, Profile, UUID } from '../types/database';

export interface CompleteProfileParams {
  role: 'employer' | 'worker';
  fullName: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD (>= 18 años)
}

export interface SignUpParams {
  email: string;
  password: string;
  role: 'employer' | 'worker';
  fullName: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignInResult {
  userId: UUID;
  /** true cuando la cuenta de Auth existe pero aún no tiene fila en profiles (primer inicio de sesión tras verificar el correo). */
  needsProfile: boolean;
  /** Datos de registro guardados en el alta (user_metadata). Solo viene cuando needsProfile = true. */
  pendingProfile: CompleteProfileParams | null;
  /** Perfil existente cuando needsProfile = false. */
  profile: Profile | null;
}

export interface UpdateMyProfileParams {
  full_name?: string;
  phone?: string;
  photo_path?: string | null;
  skills?: string | null;
  availability?: string | null;
}

// Estado interno del modo mock: cuentas registradas en esta sesión de la app.
const mockRegistered = new Set<string>();

/**
 * Servicio de autenticación y perfil.
 * RPCs sección 5.4: complete_profile, accept_terms.
 *
 * signUp / signIn / signOut / resendVerification usan Supabase Auth (no son RPC de la base).
 * En modo 'supabase' quedan pendientes del cliente oficial (Esteban); el contrato no debe cambiar.
 * Errores esperados (código en el mensaje): ERR_EMAIL_TAKEN, ERR_INVALID_CREDENTIALS, ERR_EMAIL_NOT_CONFIRMED.
 */
export const authService = {
  async signUp(params: SignUpParams): Promise<{ status: 'verification_required' }> {
    if (getServiceConfig().dataSource === 'mock') {
      const key = params.email.trim().toLowerCase();
      if (mockRegistered.has(key)) throw new Error('ERR_EMAIL_TAKEN');
      mockRegistered.add(key);
      return { status: 'verification_required' };
    }
    // Fase 1: supabase.auth.signUp({ email, password, options: { data: { role, fullName, phone, birthDate } } })
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async signIn(params: SignInParams): Promise<SignInResult> {
    if (getServiceConfig().dataSource === 'mock') {
      const list = profilesMock as Profile[];
      const profile = list.find((p) => p.role === 'employer') ?? null;
      if (!profile) throw new Error('ERR_INVALID_CREDENTIALS');
      return { userId: profile.id, needsProfile: false, pendingProfile: null, profile };
    }
    // Fase 1: supabase.auth.signInWithPassword; si no hay fila en profiles -> needsProfile + pendingProfile desde user_metadata
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async signOut(): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') return;
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async resendVerification(_email: string): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') return;
    // Fase 1: supabase.auth.resend({ type: 'signup', email })
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async getProfileById(userId: UUID): Promise<Profile | null> {
    if (getServiceConfig().dataSource === 'mock') {
      const list = profilesMock as Profile[];
      return list.find((p) => p.id === userId) ?? null;
    }
    // Fase 1: SELECT * FROM profiles WHERE id = auth.uid() (RLS)
    return callRpc<Profile | null>('get_my_profile', { p_user: userId });
  },

  async completeProfile(params: CompleteProfileParams): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('complete_profile', {
      p_role: params.role,
      p_full_name: params.fullName,
      p_phone: params.phone,
      p_birth_date: params.birthDate,
    });
  },

  async acceptTerms(document: LegalDocument, version: string): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('accept_terms', {
      p_document: document,
      p_version: version,
    });
  },

  async updateMyProfile(_userId: UUID, _patch: UpdateMyProfileParams): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    // Fase 1: UPDATE public.profiles (columnas permitidas por RLS: full_name, phone, photo_path, skills, availability)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /**
   * Baja lógica de la propia cuenta (delete_my_account). Falla con ERR_ACTIVE_OBLIGATIONS si hay
   * trabajos activos o casos abiertos. Los datos se conservan; las publicaciones abiertas se cancelan.
   */
  async deleteMyAccount(): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('delete_my_account');
  },
};
