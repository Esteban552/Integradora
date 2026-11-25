import test from 'node:test';
import assert from 'node:assert/strict';
import jobs from './jobs.json';
import payments from './payments.json';
import cases from './cases.json';
import reviews from './reviews.json';

const jobById = new Map(jobs.jobs.map((j) => [j.id, j]));

test('cada trabajo tiene su job_private y los ids son únicos', () => {
  assert.equal(new Set(jobs.jobs.map((j) => j.id)).size, jobs.jobs.length);
  for (const j of jobs.jobs) assert.ok(jobs.job_private.some((p) => p.job_id === j.id), j.id);
});

test('pagos: uno por trabajo, comisión del 10 % y total correcto', () => {
  assert.equal(new Set(payments.map((p) => p.job_id)).size, payments.length);
  for (const p of payments) {
    assert.ok(jobById.has(p.job_id), p.id);
    assert.equal(Math.round(p.job_amount_mxn * 10) / 100, p.platform_fee_mxn, p.id);
    assert.equal(Math.round((p.job_amount_mxn + p.platform_fee_mxn) * 100) / 100, p.total_charged_mxn, p.id);
  }
});

test('hay al menos un pago por cada estado relevante', () => {
  const have = new Set(payments.map((p) => p.status));
  for (const s of ['payment_pending', 'failed', 'transfer_pending', 'transferred', 'transfer_failed', 'in_claim',
    'refunded', 'refund_failed', 'partial_settlement_pending', 'partial_settlement_completed',
    'partial_settlement_failed', 'cancelled']) assert.ok(have.has(s), s);
});

test('hay al menos un trabajo por cada estado', () => {
  const have = new Set(jobs.jobs.map((j) => j.status));
  for (const s of ['published', 'has_applications', 'assigned', 'arrival_registered', 'in_progress',
    'completion_requested', 'in_claim', 'completed', 'cancelled', 'expired']) assert.ok(have.has(s), s);
});

test('casos: estados válidos por tipo y decisiones que cuadran con el pago', () => {
  const claimStates = ['open', 'in_review', 'resolved', 'closed'];
  const reportStates = ['pending', 'in_review', 'attended', 'dismissed'];
  const byJob = new Map(payments.map((p) => [p.job_id, p]));
  for (const c of cases.cases) {
    assert.ok((c.case_type === 'report' ? reportStates : claimStates).includes(c.status), c.id);
    if (c.decision) {
      const p = byJob.get(c.job_id as string)!;
      assert.ok(p, c.id);
      const tr = c.approved_transfer_amount as number, rf = c.approved_refund_amount as number;
      if (c.decision === 'transfer_full') assert.ok(tr === p.job_amount_mxn && rf === 0, c.id);
      if (c.decision === 'refund_full') assert.ok(tr === 0 && rf === p.total_charged_mxn, c.id);
      if (c.decision === 'partial') assert.ok(tr > 0 && rf > 0 && Math.round((tr + rf) * 100) === Math.round(p.total_charged_mxn * 100), c.id);
    }
    if (c.status === 'resolved') assert.ok(c.auto_close_deadline, c.id);
  }
  for (const t of ['claim', 'ticket', 'report']) assert.ok(cases.cases.some((c) => c.case_type === t), t);
  for (const s of ['open', 'in_review', 'resolved', 'closed']) assert.ok(cases.cases.some((c) => c.case_type !== 'report' && c.status === s), s);
  for (const s of reportStates) assert.ok(cases.cases.some((c) => c.case_type === 'report' && c.status === s), s);
});

test('reclamaciones abiertas solo sobre trabajos En reclamación y una por trabajo', () => {
  const open = cases.cases.filter((c) => c.case_type === 'claim' && c.status !== 'closed');
  assert.equal(new Set(open.map((c) => c.job_id)).size, open.length);
  for (const c of open) assert.equal(jobById.get(c.job_id as string)?.status, 'in_claim', c.id);
});

test('evaluaciones: sin autoevaluación y con los tres estados de moderación', () => {
  for (const r of reviews) assert.notEqual(r.reviewer_id, r.reviewee_id);
  for (const s of ['visible', 'hidden', 'removed']) assert.ok(reviews.some((r) => r.moderation_status === s), s);
});
