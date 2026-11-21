import { callRpc, getServiceConfig } from '../config';
import profilesMock from '../mocks/profiles.json';
import type { LegalDocument, Profile, UUID } from '../types/database';

export interface CompleteProfileParams {
  role: 'employer' | 'worker';
  fullName: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD (>= 18 años)
}

export interface UpdateMyProfileParams {
  full_name?: string;
  phone?: string;
  photo_path?: string | null;
  skills?: string | null;
  availability?: string | null;
}

/**
 * Servicio de autenticación y perfil.
 * RPCs sección 5.4: complete_profile, accept_terms.
 */
export const authService = {
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
};
