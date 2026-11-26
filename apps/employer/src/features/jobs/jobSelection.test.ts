// Ejecutar: npx tsx --test src/features/jobs/jobSelection.test.ts   (desde apps/employer)
import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationsService, jobsService, reviewsService, type Review } from '@trabajos/services';
import {
  REJECT_ACTION_ENABLED,
  SELECTION_BLOCK_MESSAGE,
  canReject,
  canSelect,
  profileLoadErrorMessage,
  ratingLabel,
  rejectConfirm,
  rejectErrorMessage,
  reviewDateLabel,
  selectConfirm,
  selectErrorMessage,
  selectionBlock,
  visibleReviews,
} from './jobSelection';

const NOW = new Date('2026-11-25T20:00:00-07:00');
const open = { status: 'has_applications' as const, selected_worker_id: null, start_at: '2026-11-28T14:00:00-07:00' };

test('se puede seleccionar a un candidato pendiente de un trabajo abierto y futuro', () => {
  assert.equal(selectionBlock(open, { status: 'pending' }, NOW), null);
  assert.equal(canSelect(open, { status: 'pending' }, NOW), true);
});

test('bloqueos de selección: trabajo cerrado, postulación no pendiente, inicio pasado', () => {
  assert.equal(selectionBlock({ ...open, status: 'assigned' }, { status: 'pending' }, NOW), 'job_closed');
  assert.equal(selectionBlock({ ...open, selected_worker_id: 'w1' }, { status: 'pending' }, NOW), 'job_closed');
  assert.equal(selectionBlock(open, { status: 'withdrawn' }, NOW), 'not_pending');
  assert.equal(selectionBlock(open, { status: 'accepted' }, NOW), 'not_pending');
  assert.equal(selectionBlock({ ...open, start_at: '2026-11-25T19:59:00-07:00' }, { status: 'pending' }, NOW), 'job_started');
  // Justo en el instante de inicio ya no se puede (igual que start_at <= now() en la base).
  assert.equal(selectionBlock({ ...open, start_at: '2026-11-25T20:00:00-07:00' }, { status: 'pending' }, NOW), 'job_started');
  for (const k of ['job_closed', 'not_pending', 'job_started'] as const) {
    assert.ok(SELECTION_BLOCK_MESSAGE[k].length > 0);
  }
});

test('rechazar solo aplica a pendientes de un trabajo abierto', () => {
  assert.equal(REJECT_ACTION_ENABLED, true);
  assert.equal(canReject(open, { status: 'pending' }), true);
  assert.equal(canReject(open, { status: 'accepted' }), false);
  assert.equal(canReject({ ...open, status: 'assigned' }, { status: 'pending' }), false);
});

test('textos de confirmación incluyen el nombre', () => {
  assert.equal(selectConfirm('Ana').title, 'Seleccionar a Ana');
  assert.match(selectConfirm('Ana').message, /24 horas/);
  assert.match(rejectConfirm('Ana').message, /Ana/);
});

test('mensajes de error', () => {
  assert.equal(selectErrorMessage(new Error('ERR_JOB_NOT_SELECTABLE')), SELECTION_BLOCK_MESSAGE.job_closed);
  assert.equal(selectErrorMessage(new Error('ERR_NOT_PENDING')), SELECTION_BLOCK_MESSAGE.not_pending);
  assert.equal(selectErrorMessage(new Error('ERR_DATE_IN_PAST')), SELECTION_BLOCK_MESSAGE.job_started);
  assert.match(selectErrorMessage(new Error('ERR_ACCOUNT_RESTRICTED')), /restricción/);
  assert.match(selectErrorMessage(new Error('x')), /No se pudo seleccionar/);
  assert.equal(rejectErrorMessage(new Error('ERR_NOT_PENDING')), SELECTION_BLOCK_MESSAGE.not_pending);
  assert.match(rejectErrorMessage(new Error('x')), /No se pudo rechazar/);
  assert.match(profileLoadErrorMessage(new Error('ERR_FORBIDDEN')), /permiso/);
  assert.match(profileLoadErrorMessage('x'), /No se pudo cargar/);
});

test('reseñas: solo visibles y de la más reciente a la más antigua', () => {
  const mk = (id: string, created_at: string, moderation_status: Review['moderation_status']): Review => ({
    id, job_id: 'j', reviewer_id: 'r', reviewee_id: 'w', rating: 5, comment: null, moderation_status, created_at,
  });
  const out = visibleReviews([
    mk('a', '2026-11-01T10:00:00Z', 'visible'),
    mk('b', '2026-11-10T10:00:00Z', 'hidden'),
    mk('c', '2026-11-05T10:00:00Z', 'visible'),
    mk('d', '2026-11-20T10:00:00Z', 'removed'),
  ]);
  assert.deepEqual(out.map((r) => r.id), ['c', 'a']);
});

test('etiquetas de evaluación y fecha', () => {
  assert.equal(ratingLabel(4), '4 de 5');
  assert.equal(reviewDateLabel('2026-11-20T19:15:00Z'), '20 nov 2026');
  assert.equal(reviewDateLabel('2026-11-21T03:30:00Z'), '20 nov 2026');
});

test('mock: flujo con el trabajo 1102 y sus candidatos', async () => {
  const jobs = await jobsService.getEmployerJobs('11111111-1111-4111-8111-111111111101');
  const job = jobs.find((j) => j.id === 'aaaa1111-1111-4111-8111-111111111102')!;
  const applicants = await applicationsService.getApplicants(job.id);
  assert.equal(applicants.length, 3);
  const carlos = applicants.find((a) => a.full_name.startsWith('Carlos'))!;
  assert.equal(canSelect(job, carlos, NOW), true);
  const reviews = visibleReviews(await reviewsService.getReviewsForUser(carlos.worker_id));
  assert.ok(reviews.length >= 1);
  assert.ok(reviews.every((r) => r.moderation_status === 'visible'));
  // Un candidato sin evaluaciones devuelve lista vacía, no error.
  const diego = applicants.find((a) => a.full_name.startsWith('Diego'))!;
  assert.deepEqual(await reviewsService.getReviewsForUser(diego.worker_id), []);
});
