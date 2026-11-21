import { callRpc, getServiceConfig } from '../config';
import jobsData from '../mocks/jobs.json';
import profilesMock from '../mocks/profiles.json';
import reviewsMock from '../mocks/reviews.json';
import type {
  CounterpartContact,
  Job,
  JobCategory,
  JobPrivate,
  JobPublicDetail,
  Profile,
  Review,
  SearchJobRow,
  UUID,
} from '../types/database';

export interface SaveJobParams {
  title: string;
  description: string;
  category: JobCategory;
  paymentMxn: number;
  jobDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  conditions: string | null;
  neighborhood: string;
  exactAddress: string;
  exactLatitude: number;
  exactLongitude: number;
}

export interface SearchJobsParams {
  category?: JobCategory | null;
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Servicio de trabajos temporales (Empleador y Trabajador).
 * RPCs sección 5.4: create_job, update_job, cancel_job, search_jobs, get_job_public, get_counterpart_contact.
 */
export const jobsService = {
  async getEmployerJobs(employerId: UUID): Promise<Job[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (jobsData.jobs as Job[]).filter((j) => j.employer_id === employerId);
    }
    // Fase 1: SELECT * FROM jobs WHERE employer_id = auth.uid() (RLS)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async getJobPrivate(jobId: UUID): Promise<JobPrivate | null> {
    if (getServiceConfig().dataSource === 'mock') {
      return (jobsData.job_private as JobPrivate[]).find((jp) => jp.job_id === jobId) ?? null;
    }
    // Fase 1: SELECT * FROM job_private WHERE job_id = jobId (RLS: dueño, seleccionado o admin)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async createJob(params: SaveJobParams): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return 'aaaa1111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('create_job', {
      p_title: params.title,
      p_description: params.description,
      p_category: params.category,
      p_payment: params.paymentMxn,
      p_date: params.jobDate,
      p_start: params.startTime,
      p_end: params.endTime,
      p_conditions: params.conditions,
      p_neighborhood: params.neighborhood,
      p_address: params.exactAddress,
      p_lat: params.exactLatitude,
      p_lng: params.exactLongitude,
    });
  },

  async updateJob(jobId: UUID, params: SaveJobParams): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('update_job', {
      p_job: jobId,
      p_title: params.title,
      p_description: params.description,
      p_category: params.category,
      p_payment: params.paymentMxn,
      p_date: params.jobDate,
      p_start: params.startTime,
      p_end: params.endTime,
      p_conditions: params.conditions,
      p_neighborhood: params.neighborhood,
      p_address: params.exactAddress,
      p_lat: params.exactLatitude,
      p_lng: params.exactLongitude,
    });
  },

  async cancelJob(jobId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('cancel_job', { p_job: jobId });
  },

  async searchJobs(params: SearchJobsParams = {}): Promise<SearchJobRow[]> {
    if (getServiceConfig().dataSource === 'mock') {
      const profiles = profilesMock as Profile[];
      const reviews = reviewsMock as Review[];
      return (jobsData.jobs as Job[])
        .filter((j) => ['published', 'has_applications'].includes(j.status))
        .filter((j) => (!params.category ? true : j.category === params.category))
        .map((j) => {
          const employer = profiles.find((p) => p.id === j.employer_id);
          const empReviews = reviews.filter((r) => r.reviewee_id === j.employer_id);
          const avg = empReviews.length
            ? empReviews.reduce((acc, r) => acc + r.rating, 0) / empReviews.length
            : null;
          return {
            job_id: j.id,
            title: j.title,
            category: j.category,
            fixed_payment_mxn: j.fixed_payment_mxn,
            job_date: j.job_date,
            start_time: j.start_time,
            end_time: j.end_time,
            neighborhood: j.neighborhood,
            distance_range: 'lt_5',
            out_of_range: false,
            employer_id: j.employer_id,
            employer_name: employer?.full_name ?? 'Empleador',
            employer_rating: avg,
            employer_review_count: empReviews.length,
          };
        });
    }
    return callRpc<SearchJobRow[]>('search_jobs', {
      p_category: params.category ?? null,
      p_from: params.fromDate ?? null,
      p_to: params.toDate ?? null,
      p_limit: params.limit ?? 20,
      p_offset: params.offset ?? 0,
    });
  },

  async getJobPublic(jobId: UUID): Promise<JobPublicDetail | null> {
    if (getServiceConfig().dataSource === 'mock') {
      const job = (jobsData.jobs as Job[]).find((j) => j.id === jobId);
      if (!job) return null;
      const employer = (profilesMock as Profile[]).find((p) => p.id === job.employer_id);
      return {
        job_id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        fixed_payment_mxn: job.fixed_payment_mxn,
        job_date: job.job_date,
        start_time: job.start_time,
        end_time: job.end_time,
        conditions: job.conditions,
        neighborhood: job.neighborhood,
        status: job.status,
        distance_range: 'lt_5',
        out_of_range: false,
        employer_id: job.employer_id,
        employer_name: employer?.full_name ?? 'Empleador',
        employer_rating: 5,
        employer_review_count: 1,
        already_applied: false,
      };
    }
    const rows = await callRpc<JobPublicDetail[]>('get_job_public', { p_job: jobId });
    return rows[0] ?? null;
  },

  async getCounterpartContact(jobId: UUID): Promise<CounterpartContact | null> {
    if (getServiceConfig().dataSource === 'mock') {
      const job = (jobsData.jobs as Job[]).find((j) => j.id === jobId);
      if (!job || !job.selected_worker_id) return null;
      const worker = (profilesMock as Profile[]).find((p) => p.id === job.selected_worker_id);
      return worker ? { full_name: worker.full_name, phone: worker.phone } : null;
    }
    const rows = await callRpc<CounterpartContact[]>('get_counterpart_contact', { p_job: jobId });
    return rows[0] ?? null;
  },
};
