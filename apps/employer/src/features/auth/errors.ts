// Mensajes en español para los códigos ERR_* que puede devolver el registro/inicio de sesión.
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  ERR_UNDERAGE: 'Debes ser mayor de 18 años para registrarte.',
  ERR_INVALID_PHONE: 'El teléfono no es válido.',
  ERR_INVALID_NAME: 'Escribe tu nombre o razón comercial.',
  ERR_PROFILE_EXISTS: 'Tu perfil ya está creado. Inicia sesión.',
  ERR_NOT_AUTHENTICATED: 'Inicia sesión para continuar.',
  ERR_EMAIL_TAKEN: 'Ese correo ya tiene una cuenta. Inicia sesión.',
  ERR_INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  ERR_EMAIL_NOT_CONFIRMED: 'Aún no confirmas tu correo. Abre el enlace que te enviamos.',
  ERR_WRONG_APP: 'Esta cuenta no es de Empleador. Usa la app de Trabajador.',
  ERR_ACCOUNT_RESTRICTED: 'Tu cuenta tiene una restricción activa.',
  ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT: 'El servicio de acceso aún no está conectado.',
};

const GENERIC = 'No se pudo completar la operación. Intenta de nuevo.';

/** Extrae el código ERR_* del mensaje de un error (Supabase/Postgres o propio). */
export function errorCode(err: unknown): string | null {
  const text = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err ?? '');
  const m = /ERR_[A-Z_]+/.exec(text);
  return m ? m[0] : null;
}

export function authErrorMessage(err: unknown): string {
  const code = errorCode(err);
  return (code && AUTH_ERROR_MESSAGES[code]) || GENERIC;
}
