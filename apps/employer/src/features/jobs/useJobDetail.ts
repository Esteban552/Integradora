import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applicationsService,
  jobsService,
  type ApplicantPublicProfile,
  type Job,
  type JobPrivate,
} from '@trabajos/services';
import { loadErrorMessage, sortApplicants } from './jobDetail';

export type JobDetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not_found' }
  | { status: 'ready'; job: Job; privateData: JobPrivate | null; applicants: ApplicantPublicProfile[] };

/** Carga el trabajo, su dirección exacta y sus postulantes. `reload` vuelve a pedir todo. */
export function useJobDetail(employerId: string, jobId: string) {
  const [state, setState] = useState<JobDetailState>({ status: 'loading' });
  const alive = useRef(true);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [jobs, privateData, applicants] = await Promise.all([
        jobsService.getEmployerJobs(employerId),
        jobsService.getJobPrivate(jobId),
        applicationsService.getApplicants(jobId),
      ]);
      if (!alive.current) return;
      const job = jobs.find((j) => j.id === jobId);
      setState(job ? { status: 'ready', job, privateData, applicants: sortApplicants(applicants) } : { status: 'not_found' });
    } catch (err) {
      if (alive.current) setState({ status: 'error', message: loadErrorMessage(err) });
    }
  }, [employerId, jobId]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { state, reload: load };
}
