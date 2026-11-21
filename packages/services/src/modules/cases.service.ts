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
  jobId?: UUID | null;
  ticketCategory?: TicketCategory | null;
  reportedUserId?: UUID | null;
  targetType?: ReportTarget | null;
  targetId?: UUID | null;
}

export interface ResolveClaimParams {
  caseId: UUID;
  decision: CaseDecision;
  approvedTransferAmount: number;
  approvedRefundAmount: number;
  resolutionNotes: string;
}

/**
 * Servicio de casos unificados (Tickets, Reclamaciones y Reportes).
 * Pendientes en sección 5.4: open_case, object_case, resolución y cierre administrativo.
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

  async getCaseMessages(caseId: UUID): Promise<CaseMessage[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (casesData.case_messages as CaseMessage[]).filter((m) => m.case_id === caseId);
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** TODO(RPC pendiente en 5.4): open_case */
  async openCase(params: OpenCaseParams): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'dddd1111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('open_case', {
      p_case_type: params.caseType,
      p_description: params.description,
      p_job_id: params.jobId ?? null,
      p_ticket_category: params.ticketCategory ?? null,
      p_reported_user_id: params.reportedUserId ?? null,
      p_target_type: params.targetType ?? null,
      p_target_id: params.targetId ?? null,
    });
  },

  /** TODO(RPC pendiente en 5.4): object_case (dentro de ventana de 7 días). */
  async objectCase(caseId: UUID, reason: string): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('object_case', { p_case: caseId, p_reason: reason });
  },

  /** TODO(RPC pendiente en 5.4): resolución administrativa con validación D-02. */
  async resolveClaim(params: ResolveClaimParams): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('admin_resolve_claim', {
      p_case: params.caseId,
      p_decision: params.decision,
      p_transfer_amount: params.approvedTransferAmount,
      p_refund_amount: params.approvedRefundAmount,
      p_notes: params.resolutionNotes,
    });
  },
};
