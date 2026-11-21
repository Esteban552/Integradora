import { callRpc, getServiceConfig } from '../config';
import applicationsMock from '../mocks/applications.json';
import profilesMock from '../mocks/profiles.json';
import reviewsMock from '../mocks/reviews.json';
import type {
  ApplicantPublicProfile,
  JobApplication,
  Profile,
  Review,
  UUID,
} from '../types/database';

/**
 * Servicio de postulaciones y selección de candidato.
 * RPCs sección 5.4: get_applicants, apply_to_job, withdraw_application, reject_application, select_worker.
 */
export const applicationsService = {
  async getMyApplications(workerId: UUID): Promise<JobApplication[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (applicationsMock as JobApplication[]).filter((a) => a.worker_id === workerId);
    }
    // Fase 1: SELECT * FROM job_applications WHERE worker_id = auth.uid() (RLS)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async getApplicants(jobId: UUID): Promise<ApplicantPublicProfile[]> {
    if (getServiceConfig().dataSource === 'mock') {
      const profiles = profilesMock as Profile[];
      const reviews = reviewsMock as Review[];
      return (applicationsMock as JobApplication[])
        .filter((a) => a.job_id === jobId)
        .map((a) => {
          const worker = profiles.find((p) => p.id === a.worker_id);
          const workerReviews = reviews.filter((r) => r.reviewee_id === a.worker_id);
          const avg = workerReviews.length
            ? workerReviews.reduce((acc, r) => acc + r.rating, 0) / workerReviews.length
            : null;
          return {
            application_id: a.id,
            worker_id: a.worker_id,
            status: a.status,
            applied_at: a.created_at,
            full_name: worker?.full_name ?? 'Trabajador',
            photo_path: worker?.photo_path ?? null,
            skills: worker?.skills ?? null,
            availability: worker?.availability ?? null,
            rating: avg,
            review_count: workerReviews.length,
          };
        });
    }
    return callRpc<ApplicantPublicProfile[]>('get_applicants', { p_job: jobId });
  },

  async applyToJob(jobId: UUID): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'bbbb1111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('apply_to_job', { p_job: jobId });
  },

  async withdrawApplication(applicationId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('withdraw_application', { p_app: applicationId });
  },

  /** Propuesta FL-EMP-12 (pendiente de confirmar con Eber) */
  async rejectApplication(applicationId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('reject_application', { p_app: applicationId });
  },

  async selectWorker(applicationId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('select_worker', { p_app: applicationId });
  },
};
