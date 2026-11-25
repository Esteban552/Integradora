// Ejecutar: npx tsx --test src/features/jobs/jobForm.test.ts   (desde apps/employer)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_FORM,
  PIN_BBOX,
  addDays,
  coordsToPin,
  feeBreakdown,
  hasErrors,
  hermosilloNow,
  isValidDate,
  isValidTime,
  maskDate,
  maskTime,
  parsePayment,
  pinToCoords,
  quickDates,
  saveErrorMessage,
  toSaveParams,
  validateJobForm,
  validatePhoto,
  valuesFromJob,
  type JobFormValues,
} from './jobForm';

// 2026-11-24 12:00 en Hermosillo = 19:00 UTC
const NOW = new Date('2026-11-24T19:00:00Z');

const valid: JobFormValues = {
  title: 'Limpieza de terraza',
  description: 'Barrer y lavar la terraza.',
  category: 'limpieza',
  payment: '750',
  date: '2026-11-25',
  startTime: '09:00',
  endTime: '13:00',
  conditions: '',
  neighborhood: 'Col. Centro',
  address: 'Calle 1 #100',
  pin: { x: 0.5, y: 0.5 },
  photos: [],
};

test('hora de Hermosillo (UTC-7, sin horario de verano)', () => {
  assert.deepEqual(hermosilloNow(NOW), { date: '2026-11-24', time: '12:00' });
  assert.deepEqual(hermosilloNow(new Date('2026-11-25T03:30:00Z')), { date: '2026-11-24', time: '20:30' });
  assert.deepEqual(hermosilloNow(new Date('2026-11-25T06:59:00Z')), { date: '2026-11-24', time: '23:59' });
  assert.deepEqual(hermosilloNow(new Date('2026-11-25T07:00:00Z')), { date: '2026-11-25', time: '00:00' });
});

test('fechas rápidas y validación de fecha y hora', () => {
  assert.deepEqual(quickDates(NOW).map((d) => d.value), ['2026-11-24', '2026-11-25', '2026-11-26']);
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.ok(isValidDate('2026-02-28'));
  assert.ok(!isValidDate('2026-02-30'));
  assert.ok(!isValidDate('25/11/2026'));
  assert.ok(isValidTime('00:00') && isValidTime('23:59'));
  assert.ok(!isValidTime('24:00') && !isValidTime('9:00') && !isValidTime('09:60'));
});

test('pago: formatos aceptados y rechazados', () => {
  assert.equal(parsePayment('750'), 750);
  assert.equal(parsePayment(' 1,250.50 '), 1250.5);
  assert.equal(parsePayment('10.5'), 10.5);
  assert.equal(parsePayment('10.555'), null);
  assert.equal(parsePayment('abc'), null);
  assert.equal(parsePayment(''), null);
  assert.equal(parsePayment('-5'), null);
});

test('desglose: comisión del 10 % con redondeo half-up (igual que la base de datos)', () => {
  assert.deepEqual(feeBreakdown(1000), { jobAmount: 1000, fee: 100, total: 1100 });
  assert.deepEqual(feeBreakdown(10.05), { jobAmount: 10.05, fee: 1.01, total: 11.06 }); // 1.005 -> 1.01
  assert.deepEqual(feeBreakdown(0.15 * 100), { jobAmount: 15, fee: 1.5, total: 16.5 });
  assert.deepEqual(feeBreakdown(10), { jobAmount: 10, fee: 1, total: 11 });
  assert.deepEqual(feeBreakdown(99999.99), { jobAmount: 99999.99, fee: 10000, total: 109999.99 });
});

test('formulario válido no tiene errores', () => {
  assert.deepEqual(validateJobForm(valid, NOW), {});
});

test('formulario vacío marca los campos obligatorios', () => {
  const e = validateJobForm(EMPTY_FORM, NOW);
  for (const f of ['title', 'category', 'description', 'payment', 'date', 'startTime', 'endTime', 'neighborhood', 'address', 'pin']) {
    assert.ok(e[f as keyof typeof e], f);
  }
  assert.ok(!e.conditions && !e.photos);
});

test('límites de pago', () => {
  assert.ok(validateJobForm({ ...valid, payment: '9.99' }, NOW).payment);
  assert.ok(!validateJobForm({ ...valid, payment: '10' }, NOW).payment);
  assert.ok(!validateJobForm({ ...valid, payment: '100000' }, NOW).payment);
  assert.ok(validateJobForm({ ...valid, payment: '100000.01' }, NOW).payment);
});

test('fecha y horario', () => {
  assert.ok(validateJobForm({ ...valid, date: '2026-11-23' }, NOW).date);
  assert.ok(!validateJobForm({ ...valid, date: '2026-11-24', startTime: '12:01', endTime: '13:00' }, NOW).startTime);
  assert.ok(validateJobForm({ ...valid, date: '2026-11-24', startTime: '12:00', endTime: '13:00' }, NOW).startTime);
  assert.ok(validateJobForm({ ...valid, date: '2026-11-24', startTime: '08:00', endTime: '13:00' }, NOW).startTime);
  assert.ok(validateJobForm({ ...valid, endTime: '09:00' }, NOW).endTime);
  assert.ok(validateJobForm({ ...valid, endTime: '08:00' }, NOW).endTime);
  assert.ok(validateJobForm({ ...valid, startTime: '25:00' }, NOW).startTime);
});

test('longitudes máximas y espacios', () => {
  assert.ok(validateJobForm({ ...valid, title: 'x'.repeat(151) }, NOW).title);
  assert.ok(!validateJobForm({ ...valid, title: 'x'.repeat(150) }, NOW).title);
  assert.ok(validateJobForm({ ...valid, title: '   ' }, NOW).title);
  assert.ok(validateJobForm({ ...valid, neighborhood: ' ' }, NOW).neighborhood);
  assert.ok(validateJobForm({ ...valid, conditions: 'x'.repeat(1001) }, NOW).conditions);
});

test('fotos: tipo, tamaño y cantidad', () => {
  const ok = { uri: 'file:///a.jpg', mimeType: 'image/jpeg', sizeBytes: 1000, name: 'a.jpg' };
  assert.equal(validatePhoto(ok), null);
  assert.ok(validatePhoto({ ...ok, mimeType: 'image/gif' }));
  assert.ok(validatePhoto({ ...ok, mimeType: 'application/pdf' }));
  assert.ok(validatePhoto({ ...ok, sizeBytes: 10 * 1024 * 1024 + 1 }));
  assert.equal(validatePhoto({ ...ok, sizeBytes: 10 * 1024 * 1024 }), null);
  assert.ok(validatePhoto({ ...ok, sizeBytes: 0 }));
  assert.ok(!validateJobForm({ ...valid, photos: Array(5).fill(ok) }, NOW).photos);
  assert.ok(validateJobForm({ ...valid, photos: Array(6).fill(ok) }, NOW).photos);
  assert.ok(validateJobForm({ ...valid, photos: [{ ...ok, mimeType: 'image/webp' }] }, NOW).photos);
});

test('pin <-> coordenadas', () => {
  const c = pinToCoords({ x: 0, y: 0 });
  assert.deepEqual(c, { latitude: PIN_BBOX.north, longitude: PIN_BBOX.west });
  const d = pinToCoords({ x: 1, y: 1 });
  assert.deepEqual(d, { latitude: PIN_BBOX.south, longitude: PIN_BBOX.east });
  const clamped = pinToCoords({ x: 2, y: -1 });
  assert.deepEqual(clamped, { latitude: PIN_BBOX.north, longitude: PIN_BBOX.east });
  const mid = pinToCoords({ x: 0.5, y: 0.5 });
  const back = coordsToPin(mid.latitude, mid.longitude)!;
  assert.ok(Math.abs(back.x - 0.5) < 1e-4 && Math.abs(back.y - 0.5) < 1e-4);
  assert.equal(coordsToPin(29.06, -110.97), null);
  // dentro de los rangos de la base de datos
  assert.ok(mid.latitude >= -90 && mid.latitude <= 90 && mid.longitude >= -180 && mid.longitude <= 180);
});

test('toSaveParams arma los parámetros de create_job', () => {
  const p = toSaveParams({ ...valid, title: '  Limpieza  ', conditions: '  ', payment: '1,250.50' });
  assert.equal(p.title, 'Limpieza');
  assert.equal(p.paymentMxn, 1250.5);
  assert.equal(p.startTime, '09:00:00');
  assert.equal(p.endTime, '13:00:00');
  assert.equal(p.conditions, null);
  assert.equal(p.jobDate, '2026-11-25');
  assert.ok(p.exactLatitude > 32 && p.exactLongitude < -114);
  assert.throws(() => toSaveParams({ ...valid, pin: null }), /ERR_FORM_INVALID/);
  assert.throws(() => toSaveParams({ ...valid, payment: 'x' }), /ERR_FORM_INVALID/);
});

test('valuesFromJob rellena el formulario de edición', () => {
  const job = {
    title: 'T', description: 'D', category: 'pintura', fixed_payment_mxn: 480, job_date: '2026-11-26',
    start_time: '09:00:00', end_time: '13:00:00', conditions: null, neighborhood: 'Col. X',
  } as never;
  const v = valuesFromJob(job, { job_id: 'x', exact_address: 'Calle', exact_latitude: 32.45, exact_longitude: -114.77 });
  assert.equal(v.payment, '480');
  assert.equal(v.startTime, '09:00');
  assert.equal(v.conditions, '');
  assert.ok(v.pin && v.pin.x > 0 && v.pin.x < 1);
  assert.equal(valuesFromJob(job, null).pin, null);
  assert.ok(!hasErrors(validateJobForm({ ...v, date: '2026-11-26' }, NOW)));
});

test('mensajes de error de guardado', () => {
  assert.match(saveErrorMessage(new Error('ERR_DATE_IN_PAST')), /ya pasó/);
  assert.match(saveErrorMessage(new Error('new row violates check constraint "check_payment_range"')), /\$10/);
  assert.match(saveErrorMessage(new Error('ERR_JOB_NOT_EDITABLE')), /editar/);
  assert.match(saveErrorMessage('algo raro'), /No se pudo guardar/);
});

test('máscaras de fecha y hora', () => {
  assert.equal(maskTime('0'), '0');
  assert.equal(maskTime('090'), '09:0');
  assert.equal(maskTime('0900'), '09:00');
  assert.equal(maskTime('09:00'), '09:00');
  assert.equal(maskTime('09001234'), '09:00');
  assert.equal(maskDate('2026'), '2026');
  assert.equal(maskDate('202611'), '2026-11');
  assert.equal(maskDate('20261125'), '2026-11-25');
  assert.equal(maskDate('2026-11-25'), '2026-11-25');
  assert.equal(maskDate('abc'), '');
});
