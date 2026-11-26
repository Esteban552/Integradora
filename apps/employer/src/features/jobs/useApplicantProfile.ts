import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applicationsService,
  jobsService,
  reviewsService,
  type ApplicantPublicProfile,
  type Job,
  type Review,
} from '@trabajos/services';
import { profileLoadErrorMessage, visibleReviews } from './jobSelection';

export type ApplicantProfileState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not_found' }
  | { status: 'ready'; job: Job; applicant: ApplicantPublicProfile; reviews: Review[] };

/** Carga el trabajo, la postulación y las reseñas del candidato. */
export function useApplicantProfile(employerId: string, jobId: string, applicationId: string) {
  const [state, setState] = useState<ApplicantProfileState>({ status: 'loading' });
  const alive = useRef(true);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [jobs, applicants] = await Promise.all([
        jobsService.getEmployerJobs(employerId),
        applicationsService.getApplicants(jobId),
      ]);
      const job = jobs.find((j) => j.id === jobId);
      const applicant = applicants.find((a) => a.application_id === applicationId);
      if (!job || !applicant) {
        if (alive.current) setState({ status: 'not_found' });
        return;
      }
      const reviews = await reviewsService.getReviewsForUser(applicant.worker_id);
      if (alive.current) setState({ status: 'ready', job, applicant, reviews: visibleReviews(reviews) });
    } catch (err) {
      if (alive.current) setState({ status: 'error', message: profileLoadErrorMessage(err) });
    }
  }, [employerId, jobId, applicationId]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { state, reload: load };
}
