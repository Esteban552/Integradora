// Validaciones de UI-EMP-01. La base las repite y manda (complete_profile); aquí solo adelantan el error en pantalla.

export type Issues<T extends string> = Partial<Record<T, string>>;

export const PASSWORD_RULE = 'Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.';

export function passwordChecks(pw: string): Array<{ label: string; ok: boolean }> {
  return [
    { label: 'Mínimo 8 caracteres', ok: pw.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(pw) },
    { label: 'Una minúscula', ok: /[a-z]/.test(pw) },
    { label: 'Un número', ok: /[0-9]/.test(pw) },
  ];
}

export function validatePassword(pw: string): string | null {
  return passwordChecks(pw).every((c) => c.ok) ? null : PASSWORD_RULE;
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Escribe un correo válido.';
}

// Misma expresión que complete_profile en la base.
export function validatePhone(phone: string): string | null {
  return /^[0-9+() -]{8,20}$/.test(phone) ? null : 'El teléfono no es válido.';
}

export function validateFullName(name: string): string | null {
  return name.trim().length >= 2 ? null : 'Escribe tu nombre o razón comercial.';
}

/** Mayoría de edad al día `today`. birth: 'YYYY-MM-DD'. */
export function isAdult(birth: string, today: Date = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const born = new Date(y, mo - 1, d);
  if (Number.isNaN(born.getTime()) || born.getMonth() !== mo - 1 || born.getDate() !== d) return false;
  const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return born <= cutoff;
}

/** Máscara mientras se escribe: '01011990' -> '01/01/1990'. */
export function maskBirthInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** 'DD/MM/AAAA' -> 'AAAA-MM-DD' o null si no es una fecha completa. */
export function birthToIso(masked: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(masked);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function validateBirthDate(masked: string, today: Date = new Date()): string | null {
  const iso = birthToIso(masked);
  if (!iso) return 'Escribe tu fecha de nacimiento como DD/MM/AAAA.';
  return isAdult(iso, today) ? null : 'Debes ser mayor de 18 años para registrarte.';
}

export type RegisterField = 'fullName' | 'email' | 'password' | 'phone' | 'birthDate' | 'terms';

export interface RegisterValues {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string; // enmascarada DD/MM/AAAA
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export function validateRegister(v: RegisterValues, today: Date = new Date()): Issues<RegisterField> {
  const e: Issues<RegisterField> = {};
  const checks: Array<[RegisterField, string | null]> = [
    ['fullName', validateFullName(v.fullName)],
    ['email', validateEmail(v.email)],
    ['password', validatePassword(v.password)],
    ['phone', validatePhone(v.phone)],
    ['birthDate', validateBirthDate(v.birthDate, today)],
  ];
  for (const [k, msg] of checks) if (msg) e[k] = msg;
  if (!v.acceptTerms || !v.acceptPrivacy) e.terms = 'Debes aceptar los Términos de Uso y el Aviso de Privacidad.';
  return e;
}

export type LoginField = 'email' | 'password';

export function validateLogin(email: string, password: string): Issues<LoginField> {
  const e: Issues<LoginField> = {};
  const em = validateEmail(email);
  if (em) e.email = em;
  if (password.length === 0) e.password = 'Escribe tu contraseña.';
  return e;
}
