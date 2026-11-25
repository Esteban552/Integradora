// Ejecutar: npx tsx --test src/features/jobs/jobDetail.test.ts   (desde apps/employer)
import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationsService, jobsService, type JobStatus } from '@trabajos/services';
import {
  APPLICATION_STATUS_META,
  activeApplicantsCount,
  appliedLabel,
  canCancelJob,
  canEditJob,
  cancelErrorMessage,
  detailNotice,
  formatDateTimeHermosillo,
  formatRating,
  initials,
  isReviewable,
  loadErrorMessage,
  sortApplicants,
} from './jobDetail';

const ALL: JobStatus[] = [
  'published', 'has_applications', 'assigned', 'arrival_registered', 'in_progress',
  'completion_requested', 'in_claim', 'completed', 'cancelled', 'expired',
];

test('editar y cancelar solo antes de seleccionar a un trabajador', () => {
  for (const status of ALL) {
    const open = status === 'published' || status === 'has_applications';
    assert.equal(canEditJob({ status, selected_worker_id: null }), open, status);
    assert.equal(canCancelJob({ status, selected_worker_id: null }), open, status);
  }
  // Con trabajador seleccionado ya no se puede, aunque el estado siga abierto.
  assert.equal(canEditJob({ status: 'has_applications', selected_worker_id: 'w1' }), false);
  assert.equal(canCancelJob({ status: 'published', selected_worker_id: 'w1' }), false);
});

test('cada estado de postulación tiene etiqueta', () => {
  for (const s of ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'] as const) {
    assert.ok(APPLICATION_STATUS_META[s].label.length > 0, s);
  }
});

test('mock: postulantes del trabajo 1103 se ordenan aceptada, pendiente, retirada', async () => {
  const list = await applicationsService.getApplicants('aaaa1111-1111-4111-8111-111111111103');
  const sorted = sortApplicants(list);
  assert.deepEqual(sorted.map((a) => a.status), ['accepted', 'pending', 'withdrawn']);
  assert.equal(activeApplicantsCount(list), 2);
  // No modifica la lista original.
  assert.notEqual(sorted, list);
});

test('mock: el trabajo 1102 tiene 3 pendientes por orden de postulación', async () => {
  const list = sortApplicants(await applicationsService.getApplicants('aaaa1111-1111-4111-8111-111111111102'));
  assert.equal(list.length, 3);
  assert.ok(list.every(isReviewable));
  const dates = list.map((a) => a.applied_at);
  assert.deepEqual(dates, [...dates].sort());
});

test('solo las pendientes se pueden revisar', () => {
  assert.equal(isReviewable({ status: 'pending' }), true);
  for (const s of ['accepted', 'rejected', 'withdrawn', 'expired'] as const) {
    assert.equal(isReviewable({ status: s }), false, s);
  }
});

test('evaluación del postulante', () => {
  assert.equal(formatRating(null, 0), 'Sin evaluaciones');
  assert.equal(formatRating(4.5, 0), 'Sin evaluaciones');
  assert.equal(formatRating(4.5, 1), '4.5 de 5 (1 evaluación)');
  assert.equal(formatRating(4.333, 3), '4.3 de 5 (3 evaluaciones)');
});

test('iniciales', () => {
  assert.equal(initials('Carlos Mendoza Ruiz'), 'CM');
  assert.equal(initials('  ana  '), 'A');
  assert.equal(initials(''), '?');
});

test('fecha y hora de postulación en hora de Hermosillo', () => {
  assert.equal(formatDateTimeHermosillo('2026-11-20T12:15:00-07:00'), '20 nov 2026, 12:15');
  assert.equal(formatDateTimeHermosillo('2026-11-20T19:15:00Z'), '20 nov 2026, 12:15');
  // Cruce de medianoche: 03:30 UTC del día 21 es 20:30 del 20 en Hermosillo.
  assert.equal(formatDateTimeHermosillo('2026-11-21T03:30:00Z'), '20 nov 2026, 20:30');
  assert.equal(formatDateTimeHermosillo('no es fecha'), 'no es fecha');
  assert.equal(appliedLabel('2026-11-20T19:15:00Z'), 'Postuló el 20 nov 2026, 12:15');
});

test('avisos del encabezado según el estado', () => {
  assert.equal(detailNotice({ status: 'cancelled', selected_worker_id: null }, 0)?.message, 'Esta publicación fue cancelada.');
  assert.equal(detailNotice({ status: 'expired', selected_worker_id: null }, 0)?.tone, 'warning');
  assert.match(detailNotice({ status: 'published', selected_worker_id: null }, 0)!.message, /Aún no hay postulaciones/);
  assert.equal(detailNotice({ status: 'has_applications', selected_worker_id: null }, 2), null);
});

test('mensajes de error de cancelación y carga', () => {
  assert.match(cancelErrorMessage(new Error('ERR_USE_CASE_INSTEAD')), /abre un caso/);
  assert.match(cancelErrorMessage(new Error('ERR_FORBIDDEN')), /permiso/);
  assert.match(cancelErrorMessage(new Error('boom')), /No se pudo cancelar/);
  assert.match(loadErrorMessage(new Error('ERR_FORBIDDEN')), /permiso/);
  assert.match(loadErrorMessage('lo que sea'), /No se pudo cargar/);
});

test('mock: el trabajo 1102 del empleador 1101 existe y se puede editar', async () => {
  const jobs = await jobsService.getEmployerJobs('11111111-1111-4111-8111-111111111101');
  const job = jobs.find((j) => j.id === 'aaaa1111-1111-4111-8111-111111111102');
  assert.ok(job);
  assert.equal(canEditJob(job), true);
  const priv = await jobsService.getJobPrivate(job.id);
  assert.ok(priv && priv.exact_address.length > 0);
});
