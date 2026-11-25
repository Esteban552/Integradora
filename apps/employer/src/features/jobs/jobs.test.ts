// Ejecutar: npx tsx --test src/features/jobs/jobs.test.ts   (desde apps/employer)
import test from 'node:test';
import assert from 'node:assert/strict';
import { jobsService, type EmployerJobSummary, type JobStatus } from '@trabajos/services';
import {
  FEED_FILTERS,
  JOB_STATUS_META,
  applicantsLabel,
  destinationFor,
  filterJobs,
  formatDate,
  formatMxn,
  formatTime,
  matchesFilter,
} from './jobPresentation';

const ALL: JobStatus[] = [
  'published', 'has_applications', 'assigned', 'arrival_registered', 'in_progress',
  'completion_requested', 'in_claim', 'completed', 'cancelled', 'expired',
];

test('cada estado aparece en exactamente un grupo de filtro', () => {
  const groups = FEED_FILTERS.filter((f) => f.id !== 'all');
  for (const s of ALL) {
    const hits = groups.filter((g) => matchesFilter(s, g.id));
    assert.equal(hits.length, 1, s);
    assert.ok(matchesFilter(s, 'all'));
    assert.ok(JOB_STATUS_META[s].label.length > 0);
  }
});

test('destino por estado', () => {
  assert.equal(destinationFor('published'), 'UI-EMP-04');
  assert.equal(destinationFor('has_applications'), 'UI-EMP-04');
  assert.equal(destinationFor('expired'), 'UI-EMP-04');
  assert.equal(destinationFor('assigned'), 'UI-EMP-06');
  assert.equal(destinationFor('arrival_registered'), 'UI-EMP-07');
  assert.equal(destinationFor('completion_requested'), 'UI-EMP-09');
  assert.equal(destinationFor('in_claim'), 'UI-EMP-06');
});

test('formatos de fecha, hora, monto y postulantes', () => {
  assert.equal(formatDate('2026-11-25'), '25 nov 2026');
  assert.equal(formatDate('2026-12-01'), '1 dic 2026');
  assert.equal(formatDate('raro'), 'raro');
  assert.equal(formatTime('09:00:00'), '09:00');
  assert.equal(formatMxn(1100), '$1,100.00 MXN');
  assert.equal(formatMxn(450.5), '$450.50 MXN');
  assert.equal(formatMxn(1234567.8), '$1,234,567.80 MXN');
  assert.equal(applicantsLabel(1), '1 postulante');
  assert.equal(applicantsLabel(0), '0 postulantes');
});

test('mock: trabajos del empleador con conteo, filtro y orden', async () => {
  const jobs: EmployerJobSummary[] = await jobsService.getEmployerJobSummaries('11111111-1111-4111-8111-111111111101');
  assert.ok(jobs.length > 0);
  assert.ok(jobs.every((j) => j.employer_id === '11111111-1111-4111-8111-111111111101'));
  assert.ok(jobs.every((j) => Number.isInteger(j.applicants_count) && j.applicants_count >= 0));
  const sorted = filterJobs(jobs, 'all');
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i - 1]!.created_at >= sorted[i]!.created_at);
  const open = filterJobs(jobs, 'open');
  assert.ok(open.every((j) => j.status === 'published' || j.status === 'has_applications'));
  const total = ['open', 'active', 'closed'].reduce((n, f) => n + filterJobs(jobs, f as 'open').length, 0);
  assert.equal(total, jobs.length);
});
