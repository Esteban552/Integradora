import { callRpc, getServiceConfig } from '../config';
import profilesMock from '../mocks/profiles.json';
import type { Profile, ReportTarget, SanctionType, UUID } from '../types/database';

/**
 * Servicio exclusivo del Panel Web Administrador (UI-ADM-05, UI-ADM-06).
 * Pendientes en sección 5.4: moderación de contenidos, sanciones y baja lógica.
 */
export const adminService = {
  async listUsers(): Promise<Profile[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return profilesMock as Profile[];
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** TODO(RPC pendiente en 5.4): moderación (hide | remove | restore | dismiss). */
  async moderateContent(
    targetType: ReportTarget,
    targetId: UUID,
    action: 'hide' | 'remove' | 'restore' | 'dismiss',
    reason: string,
    caseId?: UUID
  ): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_moderate_content', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_action: action,
      p_reason: reason,
      p_case_id: caseId ?? null,
    });
  },

  /** TODO(RPC pendiente en 5.4): sanciones y baja lógica (RF-29, RF-30). */
  async applySanction(
    userId: UUID,
    sanction: SanctionType,
    reason: string,
    caseId?: UUID
  ): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_apply_sanction', {
      p_user: userId,
      p_sanction: sanction,
      p_reason: reason,
      p_case_id: caseId ?? null,
    });
  },
};
