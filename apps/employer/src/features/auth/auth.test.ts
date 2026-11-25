// Ejecutar: npx tsx --test src/features/auth/auth.test.ts   (desde apps/employer)
import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, errorCode } from './errors';
import { loginEmployer, registerEmployer } from './authFlow';
import {
  birthToIso,
  isAdult,
  maskBirthInput,
  validateLogin,
  validatePassword,
  validateRegister,
  type RegisterValues,
} from './validation';

const NOW = new Date(2026, 10, 23); // 23/11/2026
const ok: RegisterValues = {
  fullName: 'Café La Loma',
  email: 'contacto@cafelaloma.mx',
  password: 'Empleador2026',
  phone: '662-214-7780',
  birthDate: '11/06/1988',
  acceptTerms: true,
  acceptPrivacy: true,
};

test('contraseña: exige 8+, mayúscula, minúscula y número', () => {
  assert.equal(validatePassword('Empleador2026'), null);
  for (const bad of ['corta1A', 'sinmayuscula1', 'SINMINUSCULA1', 'SinNumeroAqui']) assert.notEqual(validatePassword(bad), null, bad);
});

test('mayoría de edad: borde exacto de 18 años', () => {
  assert.equal(isAdult('2008-11-23', NOW), true);
  assert.equal(isAdult('2008-11-24', NOW), false);
  assert.equal(isAdult('2002-02-30', NOW), false); // fecha inexistente
  assert.equal(isAdult('basura', NOW), false);
});

test('máscara y conversión de fecha', () => {
  assert.equal(maskBirthInput('11061988'), '11/06/1988');
  assert.equal(maskBirthInput('1a1-0'), '11/0');
  assert.equal(birthToIso('11/06/1988'), '1988-06-11');
  assert.equal(birthToIso('11/06/88'), null);
});

test('registro válido no tiene errores; vacío los marca todos', () => {
  assert.deepEqual(validateRegister(ok, NOW), {});
  const e = validateRegister({ ...ok, fullName: '', email: 'x', password: 'a', phone: '1', birthDate: '', acceptTerms: false }, NOW);
  assert.deepEqual(Object.keys(e).sort(), ['birthDate', 'email', 'fullName', 'password', 'phone', 'terms']);
});

test('registro: sin aceptar privacidad falla; menor de edad falla', () => {
  assert.ok(validateRegister({ ...ok, acceptPrivacy: false }, NOW).terms);
  assert.ok(validateRegister({ ...ok, birthDate: '24/11/2008' }, NOW).birthDate);
});

test('teléfono usa la misma regla que la base', () => {
  assert.ok(validateRegister({ ...ok, phone: 'abc12345' }, NOW).phone);
  assert.equal(validateRegister({ ...ok, phone: '+52 (662) 214-7780' }, NOW).phone, undefined);
});

test('login: correo y contraseña obligatorios', () => {
  assert.deepEqual(validateLogin('a@b.co', 'x'), {});
  assert.deepEqual(Object.keys(validateLogin('', '')).sort(), ['email', 'password']);
});

test('errores: extrae ERR_* y nunca muestra el código crudo', () => {
  assert.equal(errorCode(new Error('new row violates: ERR_UNDERAGE')), 'ERR_UNDERAGE');
  assert.equal(authErrorMessage(new Error('ERR_EMAIL_TAKEN')), 'Ese correo ya tiene una cuenta. Inicia sesión.');
  assert.equal(authErrorMessage(new Error('ERR_RARO')), 'No se pudo completar la operación. Intenta de nuevo.');
  assert.ok(!authErrorMessage(new Error('ERR_RARO')).includes('ERR_'));
});

test('flujo mock: registro, duplicado y login', async () => {
  const first = await registerEmployer(ok);
  assert.deepEqual(first, { ok: true, value: 'verification_required' });
  const dup = await registerEmployer(ok);
  assert.equal(dup.ok, false);
  if (!dup.ok) assert.equal(dup.code, 'ERR_EMAIL_TAKEN');
  const login = await loginEmployer(ok.email, ok.password);
  assert.equal(login.ok, true);
  if (login.ok) assert.equal(login.value.role, 'employer');
});
