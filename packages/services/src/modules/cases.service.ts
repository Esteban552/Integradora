import { callRpc, getServiceConfig } from '../config';
import casesData from '../mocks/cases.json';
import type {
  CaseDecision,
  CaseMessage,
  CaseRecord,
  CaseType,
  ReportTarget,
  TicketCategory,
  UUID,
} from '../types/database';

export interface OpenCaseParams {
  caseType: CaseType;
  description: string;
  /** Obligatorio en reclamaciones; opcional en tickets (debes ser parte del trabajo). */
  jobId?: UUID | null;
  /** Obligatoria en tickets. */
  ticketCategory?: TicketCategory | null;
  /** Obligatorios en reportes. El usuario reportado lo deduce el servidor. */
  targetType?: ReportTarget | null;
  targetId?: UUID | null;
}

export interface ResolveCaseParams {
  caseId: UUID;
  /** 10 a 4000 caracteres. */
  notes: string;
  /** Solo reclamaciones. */
  decision?: CaseDecision;
  /** Solo decisión 'partial': monto para el trabajador; el reembolso es el resto del total cobrado. */
  transferAmount?: number;
}

/**
 * Servicio de casos unificados (Tickets, Reclamaciones y Reportes).
 * RPC reales: open_case, add_case_message, object_case, admin_assign_case,
 * admin_resolve_case, admin_close_report (003 y 004).
 */
export const casesService = {
  async getMyCases(userId: UUID): Promise<CaseRecord[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (casesData.cases as CaseRecord[]).filter((c) => c.reporter_id === userId);
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** Bandeja completa para Panel Web Administrador (UI-ADM-02). */
  async getAllCases(): Promise<CaseRecord[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return casesData.cases as CaseRecord[];
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** El cliente recibe los mensajes visibles; el admin recibe también las notas internas. */
  async getCaseMessages(caseId: UUID, includeInternal = false): Promise<CaseMessage[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (casesData.case_messages as CaseMessage[]).filter(
        (m) => m.case_id === caseId && (includeInternal || !m.is_internal)
      );
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** Devuelve el id del caso. */
  async openCase(params: OpenCaseParams): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'dddd1111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('open_case', {
      p_type: params.caseType,
      p_description: params.description,
      p_job: params.jobId ?? null,
      p_category: params.ticketCategory ?? null,
      p_target_type: params.targetType ?? null,
      p_target_id: params.targetId ?? null,
    });
  },

  async addCaseMessage(caseId: UUID, body: string, internal = false): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'eeee1111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('add_case_message', { p_case: caseId, p_body: body, p_internal: internal });
  },

  /** Una sola vez por caso y dentro de los 7 días posteriores a la resolución. */
  async objectCase(caseId: UUID, reason: string): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('object_case', { p_case: caseId, p_reason: reason });
  },

  /** Admin: tomar un caso (Abierto/Pendiente -> En revisión). */
  async assignCase(caseId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_assign_case', { p_case: caseId });
  },

  /** Admin: resolver ticket o reclamación. Los montos de la reclamación los calcula el servidor. */
  async resolveCase(params: ResolveCaseParams): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_resolve_case', {
      p_case: params.caseId,
      p_notes: params.notes,
      p_decision: params.decision ?? null,
      p_transfer: params.transferAmount ?? null,
    });
  },

  /** Admin: cerrar un reporte como atendido o descartado. */
  async closeReport(caseId: UUID, outcome: 'attended' | 'dismissed', notes: string): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_close_report', { p_case: caseId, p_outcome: outcome, p_notes: notes });
  },
};
