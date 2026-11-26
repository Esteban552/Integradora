import type { ApplicantPublicProfile, Job, Review } from '@trabajos/services';
import { errorCode } from '../auth/errors';
import { formatDateTimeHermosillo, isOpenForChanges } from './jobDetail';
import { formatDate } from './jobPresentation';

/**
 * Lógica de UI-EMP-05 — Perfil del candidato y selección (RF-12, FL-EMP-05).
 * Funciones puras y sin dependencias de React Native, para probarlas con node:test.
 */

/**
 * FL-EMP-12 (rechazar postulación) está como propuesta pendiente de confirmar con Eber.
 * La función de la base (reject_application) ya existe. Poner en false para ocultar el botón.
 */
export const REJECT_ACTION_ENABLED = true;

export type SelectionBlock = 'job_closed' | 'not_pending' | 'job_started';

/** Motivo por el que no se puede seleccionar, o null si se puede. Reglas de select_worker. */
export function selectionBlock(
  job: Pick<Job, 'status' | 'selected_worker_id' | 'start_at'>,
  applicant: Pick<ApplicantPublicProfile, 'status'>,
  now: Date = new Date()
): SelectionBlock | null {
  if (!isOpenForChanges(job)) return 'job_closed';
  if (applicant.status !== 'pending') return 'not_pending';
  if (Date.parse(job.start_at) <= now.getTime()) return 'job_started';
  return null;
}

export const SELECTION_BLOCK_MESSAGE: Record<SelectionBlock, string> = {
  job_closed: 'Esta publicación ya no está abierta para seleccionar a un trabajador.',
  not_pending: 'Esta postulación ya no está pendiente.',
  job_started: 'El inicio del trabajo ya pasó, por eso no se puede seleccionar a nadie.',
};

export function canSelect(
  job: Pick<Job, 'status' | 'selected_worker_id' | 'start_at'>,
  applicant: Pick<ApplicantPublicProfile, 'status'>,
  now: Date = new Date()
): boolean {
  return selectionBlock(job, applicant, now) === null;
}

/** Rechazar solo aplica a postulaciones pendientes de un trabajo abierto (reject_application). */
export function canReject(
  job: Pick<Job, 'status' | 'selected_worker_id'>,
  applicant: Pick<ApplicantPublicProfile, 'status'>
): boolean {
  return REJECT_ACTION_ENABLED && isOpenForChanges(job) && applicant.status === 'pending';
}

export function selectConfirm(workerName: string) {
  return {
    title: `Seleccionar a ${workerName}`,
    message:
      'Se le asignará el trabajo y tendrá 24 horas para aceptar las condiciones y completar el alta de pagos. ' +
      'Las demás postulaciones seguirán pendientes por si ese plazo vence.',
    confirm: 'Sí, seleccionar',
    dismiss: 'Volver',
  };
}

export function rejectConfirm(workerName: string) {
  return {
    title: 'Rechazar postulación',
    message: `Se descartará la postulación de ${workerName}. Esta acción no se puede deshacer.`,
    confirm: 'Sí, rechazar',
    dismiss: 'Volver',
  };
}

export function selectErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ERR_JOB_NOT_SELECTABLE':
      return SELECTION_BLOCK_MESSAGE.job_closed;
    case 'ERR_NOT_PENDING':
      return SELECTION_BLOCK_MESSAGE.not_pending;
    case 'ERR_DATE_IN_PAST':
      return SELECTION_BLOCK_MESSAGE.job_started;
    case 'ERR_ACCOUNT_RESTRICTED':
      return 'Tu cuenta tiene una restricción activa y no puede seleccionar candidatos.';
    case 'ERR_FORBIDDEN':
      return 'No tienes permiso para esta acción.';
    case 'ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT':
      return 'El servicio aún no está conectado.';
    default:
      return 'No se pudo seleccionar al candidato. Intenta de nuevo.';
  }
}

export function rejectErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ERR_NOT_PENDING':
      return SELECTION_BLOCK_MESSAGE.not_pending;
    case 'ERR_FORBIDDEN':
      return 'No tienes permiso para esta acción.';
    case 'ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT':
      return 'El servicio aún no está conectado.';
    default:
      return 'No se pudo rechazar la postulación. Intenta de nuevo.';
  }
}

export function profileLoadErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'ERR_FORBIDDEN':
      return 'No tienes permiso para ver este perfil.';
    case 'ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT':
      return 'El servicio aún no está conectado.';
    default:
      return 'No se pudo cargar el perfil. Intenta de nuevo.';
  }
}

/** Reseñas visibles, de la más reciente a la más antigua. */
export function visibleReviews(reviews: Review[]): Review[] {
  return reviews
    .filter((r) => r.moderation_status === 'visible')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function ratingLabel(rating: number): string {
  return `${rating} de 5`;
}

/** '2026-11-20T19:15:00Z' -> '20 nov 2026' en hora de Hermosillo. */
export function reviewDateLabel(iso: string): string {
  const full = formatDateTimeHermosillo(iso);
  const comma = full.indexOf(',');
  return comma === -1 ? formatDate(iso) : full.slice(0, comma);
}
