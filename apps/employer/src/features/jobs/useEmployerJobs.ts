import { useCallback, useEffect, useRef, useState } from 'react';
import { jobsService, type EmployerJobSummary } from '@trabajos/services';
import { authErrorMessage } from '../auth/errors';

export type JobsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; jobs: EmployerJobSummary[] };

/** Carga los trabajos del empleador. `refresh` recarga sin volver a mostrar la pantalla de carga. */
export function useEmployerJobs(employerId: string) {
  const [state, setState] = useState<JobsState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setState({ status: 'loading' });
      else setRefreshing(true);
      try {
        const jobs = await jobsService.getEmployerJobSummaries(employerId);
        if (alive.current) setState({ status: 'ready', jobs });
      } catch (err) {
        if (alive.current) setState({ status: 'error', message: authErrorMessage(err) });
      } finally {
        if (alive.current) setRefreshing(false);
      }
    },
    [employerId]
  );

  useEffect(() => {
    alive.current = true;
    void load('initial');
    return () => {
      alive.current = false;
    };
  }, [load]);

  return {
    state,
    refreshing,
    refresh: () => load('refresh'),
    retry: () => load('initial'),
  };
}
