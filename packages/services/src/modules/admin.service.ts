import { callRpc, getServiceConfig } from '../config';
import profilesMock from '../mocks/profiles.json';
import type { Profile, SanctionType, UUID } from '../types/database';

/**
 * Servicio exclusivo del Panel Web Administrador (UI-ADM-05, UI-ADM-06).
 * RPC reales (004): admin_moderate, admin_sanction, admin_revoke_sanction.
 */
export const adminService = {
  async listUsers(): Promise<Profile[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return profilesMock as Profile[];
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /**
   * Moderación (hide | remove | restore | dismiss) de publicaciones, evaluaciones y mensajes de chat.
   * Usuarios y postulaciones se tratan con sanciones. Devuelve el id de la bitácora.
   */
  async moderateContent(
    targetType: 'job' | 'review' | 'chat_message',
    targetId: UUID,
    action: 'hide' | 'remove' | 'restore' | 'dismiss',
    reason: string,
    caseId?: UUID
  ): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'bbbb1111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('admin_moderate', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_action: action,
      p_reason: reason,
      p_case: caseId ?? null,
    });
  },

  /** Sanciones y baja lógica (RF-29, RF-30). Devuelve el id de la sanción. */
  async applySanction(
    userId: UUID,
    sanction: SanctionType,
    reason: string,
    caseId?: UUID
  ): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'bbbb1111-1111-4111-8111-999999999998';
    }
    return callRpc<UUID>('admin_sanction', {
      p_user: userId,
      p_sanction: sanction,
      p_reason: reason,
      p_case: caseId ?? null,
    });
  },

  /** Revoca una sanción y recalcula el estado de la cuenta. La baja lógica no es revocable. */
  async revokeSanction(sanctionId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_revoke_sanction', { p_sanction: sanctionId });
  },
};
