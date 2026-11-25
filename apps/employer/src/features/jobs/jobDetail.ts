import type { ApplicantPublicProfile, ApplicationStatus, Job } from '@trabajos/services';
import type { BadgeTone } from '@trabajos/ui';
import { errorCode } from '../auth/errors';
import { formatDate, formatTime } from './jobPresentation';

/**
 * Lógica de UI-EMP-04 — Detalle de la publicación y postulantes (RF-05, RF-06, RF-11).
 * Funciones puras y sin dependencias de React Native, para probarlas con node:test.
 */

// Estados en los que la base permite editar y cancelar directamente (update_job / cancel_job):
// solo antes de seleccionar a un trabajador.
const OPEN_STATUSES: Array<Job['status']> = ['published', 'has_applications'];

export function isOpenForChanges(job: Pick<Job, 'status' | 'selected_worker_id'>): boolean {
  return OPEN_STATUSES.includes(job.status) && job.selected_worker_id === null;
}

export const canEditJob = isOpenForChanges;
export const canCancelJob = isOpenForChanges;

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  accepted: { label: 'Aceptada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'neutral' },
  withdrawn: { label: 'Retirada', tone: 'neutral' },
  expired: { label: 'Expirada', tone: 'neutral' },
};

const STATUS_RANK: Record<ApplicationStatus, number> = {
  accepted: 0,
  pending: 1,
  rejected: 2,
  withdrawn: 3,
  expired: 4,
};

/** Aceptada primero, luego pendientes, luego el resto; dentro de cada grupo, por orden de postulación. */
export function sortApplicants(list: ApplicantPublicProfile[]): ApplicantPublicProfile[] {
  return [...list].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.applied_at.localeCompare(b.applied_at)
  );
}

/** Postulaciones vigentes (pendientes o aceptadas), igual que el conteo de UI-EMP-02. */
export function activeApplicantsCount(list: ApplicantPublicProfile[]): number {
  return list.filter((a) => a.status === 'pending' || a.status === 'accepted').length;
}

/** Solo las postulaciones pendientes se pueden revisar para seleccionar (UI-EMP-05). */
export function isReviewable(app: Pick<ApplicantPublicProfile, 'status'>): boolean {
  return app.status === 'pending';
}

export function formatRating(rating: number | null, reviewCount: number): string {
  if (rating === null || reviewCount <= 0) return 'Sin evaluaciones';
  const noun = reviewCount === 1 ? 'evaluación' : 'evaluaciones';
  return `${rating.toFixed(1)} de 5 (${reviewCount} ${noun})`;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]!.charAt(0);
  const second = parts.length > 1 ? parts[1]!.charAt(0) : '';
  return (first + second).toUpperCase();
}

/** '2026-11-20T19:15:00Z' -> '20 nov 2026, 12:15' en hora de Hermosillo (UTC-7, sin horario de verano). */
export function formatDateTimeHermosillo(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const local = new Date(ms - 7 * 3600 * 1000).toISOString();
  return `${formatDate(local.slice(0, 10))}, ${formatTime(local.slice(11, 16))}`;
}

export function appliedLabel(iso: string): string {
  return `Postuló el ${formatDateTimeHermosillo(iso)}`;
}

/** Texto del encabezado según el estado y las postulaciones. */
export function detailNotice(
  job: Pick<Job, 'status' | 'selected_worker_id'>,
  activeCount: number
): { tone: 'info' | 'warning'; message: string } | null {
  if (job.status === 'cancelled') return { tone: 'info', message: 'Esta publicación fue cancelada.' };
  if (job.status === 'expired') return { tone: 'warning', message: 'Esta publicación venció sin seleccionar a un trabajador.' };
  if (isOpenForChanges(job)) {
    return activeCount === 0
      ? { tone: 'info', message: 'Aún no hay postulaciones. Te avisaremos cuando llegue una.' }
      : null;
  }
  return null;
}

export const CANCEL_CONFIRM = {
  title: 'Cancelar publicación',
  message: 'Se cancelará la publicación y se rechazarán las postulaciones pendientes. Esta acción no se puede deshacer.',
  confirm: 'Sí, cancelar',
  dismiss: 'Volver',
};

export function cancelErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ERR_USE_CASE_INSTEAD':
      return 'Ya hay un trabajador seleccionado. Para cancelar, abre un caso desde el detalle del trabajo.';
    case 'ERR_FORBIDDEN':
      return 'No tienes permiso para esta acción.';
    case 'ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT':
      return 'El servicio aún no está conectado.';
    default:
      return 'No se pudo cancelar la publicación. Intenta de nuevo.';
  }
}

export function loadErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ERR_FORBIDDEN':
      return 'No tienes permiso para ver esta publicación.';
    case 'ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT':
      return 'El servicio aún no está conectado.';
    default:
      return 'No se pudo cargar la publicación. Intenta de nuevo.';
  }
}
