import { callRpc, getServiceConfig } from '../config';
import jobsData from '../mocks/jobs.json';
import type {
  CompletionMethod,
  JobCompletion,
  RenewCodeResult,
  UUID,
  VerifyCodeResult,
} from '../types/database';

/**
 * Servicio de ejecución del trabajo asignado (condiciones, llegada y finalización).
 * RPCs sección 5.4: confirm_conditions, register_arrival, request_completion,
 * verify_completion_code, renew_completion_code.
 * Pendiente en 5.4: respond_completion.
 */
export const executionService = {
  async confirmConditions(jobId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('confirm_conditions', { p_job: jobId });
  },

  async registerArrival(jobId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('register_arrival', { p_job: jobId });
  },

  async requestCompletion(jobId: UUID, method: CompletionMethod): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('request_completion', {
      p_job: jobId,
      p_method: method,
    });
  },

  async verifyCompletionCode(jobId: UUID, code: string): Promise<VerifyCodeResult> {
    if (getServiceConfig().dataSource === 'mock') {
      const record = (jobsData.job_completion as JobCompletion[]).find((c) => c.job_id === jobId);
      if (!record) return 'expired';
      return record.code === code ? 'ok' : 'invalid';
    }
    return callRpc<VerifyCodeResult>('verify_completion_code', {
      p_job: jobId,
      p_code: code,
    });
  },

  async renewCompletionCode(jobId: UUID): Promise<RenewCodeResult> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'renewed';
    }
    return callRpc<RenewCodeResult>('renew_completion_code', { p_job: jobId });
  },

  /** SOLO el empleador dueño puede leer job_completion (RLS en 001_trabajos_temporales.sql). */
  async getCompletionCodeForEmployer(jobId: UUID): Promise<JobCompletion | null> {
    if (getServiceConfig().dataSource === 'mock') {
      return (jobsData.job_completion as JobCompletion[]).find((c) => c.job_id === jobId) ?? null;
    }
    // Fase 1: SELECT * FROM job_completion WHERE job_id = jobId (RLS solo empleador)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** TODO(RPC pendiente en 5.4): confirmar o impugnar finalización sin código. */
  async respondCompletion(
    jobId: UUID,
    action: 'confirm' | 'dispute',
    notes?: string
  ): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('respond_completion', {
      p_job: jobId,
      p_action: action,
      p_notes: notes ?? null,
    });
  },
};
