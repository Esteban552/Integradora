import type { EmployerJobSummary, JobCategory, JobStatus } from '@trabajos/services';
import type { BadgeTone } from '@trabajos/ui';

// Etiquetas y tonos de estado de trabajo (RF-11, según el diseño aprobado).
export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: BadgeTone }> = {
  published: { label: 'Publicado', tone: 'info' },
  has_applications: { label: 'Con postulaciones', tone: 'info' },
  assigned: { label: 'Asignado', tone: 'warning' },
  arrival_registered: { label: 'Llegada registrada', tone: 'warning' },
  in_progress: { label: 'En curso', tone: 'success' },
  completion_requested: { label: 'Finalización solicitada', tone: 'purple' },
  in_claim: { label: 'En reclamación', tone: 'error' },
  completed: { label: 'Finalizado', tone: 'success' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
  expired: { label: 'Vencido', tone: 'neutral' },
};

export const CATEGORY_LABEL: Record<JobCategory, string> = {
  limpieza: 'Limpieza',
  pintura: 'Pintura',
  jardineria: 'Jardinería',
  mudanzas: 'Mudanzas',
  eventos: 'Eventos',
  otros: 'Otros',
};

export type FeedFilter = 'all' | 'open' | 'active' | 'closed';

export const FEED_FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Abiertos' },
  { id: 'active', label: 'En operación' },
  { id: 'closed', label: 'Cerrados' },
];

const GROUPS: Record<Exclude<FeedFilter, 'all'>, JobStatus[]> = {
  open: ['published', 'has_applications'],
  active: ['assigned', 'arrival_registered', 'in_progress', 'completion_requested', 'in_claim'],
  closed: ['completed', 'cancelled', 'expired'],
};

export function matchesFilter(status: JobStatus, filter: FeedFilter): boolean {
  return filter === 'all' || GROUPS[filter].includes(status);
}

/** Más recientes primero. */
export function sortJobs(jobs: EmployerJobSummary[]): EmployerJobSummary[] {
  return [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function filterJobs(jobs: EmployerJobSummary[], filter: FeedFilter): EmployerJobSummary[] {
  return sortJobs(jobs.filter((j) => matchesFilter(j.status, filter)));
}

/** Pantalla a la que lleva cada trabajo. */
export type JobDestination = 'UI-EMP-04' | 'UI-EMP-06' | 'UI-EMP-07' | 'UI-EMP-09';

export function destinationFor(status: JobStatus): JobDestination {
  switch (status) {
    case 'published':
    case 'has_applications':
    case 'cancelled':
    case 'expired': // sugerencia: un trabajo vencido no tuvo selección, por eso va al detalle (UI-EMP-04)
      return 'UI-EMP-04';
    case 'arrival_registered':
      return 'UI-EMP-07';
    case 'in_progress':
    case 'completion_requested':
      return 'UI-EMP-09';
    default:
      return 'UI-EMP-06'; // assigned, in_claim, completed
  }
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** '2026-11-25' -> '25 nov 2026'. Sin Intl, para no depender del motor del dispositivo. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso;
}

/** '09:00:00' -> '09:00'. */
export function formatTime(t: string): string {
  return /^\d{2}:\d{2}/.test(t) ? t.slice(0, 5) : t;
}

/** 1100 -> '$1,100.00 MXN'. */
export function formatMxn(amount: number): string {
  const [int, dec] = amount.toFixed(2).split('.');
  return `$${int!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec} MXN`;
}

export function applicantsLabel(n: number): string {
  return `${n} ${n === 1 ? 'postulante' : 'postulantes'}`;
}
