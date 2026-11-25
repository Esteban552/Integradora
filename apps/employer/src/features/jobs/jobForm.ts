import type { Job, JobCategory, JobPrivate, SaveJobParams } from '@trabajos/services';

// Reglas del formulario de publicación (UI-EMP-03, RF-05). Reflejan los CHECK y
// validaciones de create_job / update_job en 001_trabajos_temporales.sql.

export const MIN_PAYMENT = 10;
export const MAX_PAYMENT = 100000;
export const TITLE_MAX = 150;
export const NEIGHBORHOOD_MAX = 150;
export const DESCRIPTION_MAX = 2000;
export const CONDITIONS_MAX = 1000;
export const ADDRESS_MAX = 500;
export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIMES = ['image/jpeg', 'image/png'] as const;
/** Comisión de la plataforma (RF-17): 10 % del pago, redondeo half-up a centavos. */
export const FEE_RATE_PERCENT = 10;

/**
 * Zona del mapa de referencia (sugerencia mía: San Luis Río Colorado).
 * Sin geocodificación automática (S3): el empleador toca un punto de esta zona.
 * Cambiar según la zona de operación que confirme Eber.
 */
export const PIN_BBOX = { north: 32.516, south: 32.396, west: -114.842, east: -114.702 } as const;

export interface PhotoDraft {
  uri: string;
  mimeType: string;
  sizeBytes: number;
  name: string;
}

export interface PinPoint {
  /** 0 = borde izquierdo, 1 = borde derecho. */
  x: number;
  /** 0 = borde superior, 1 = borde inferior. */
  y: number;
}

export interface JobFormValues {
  title: string;
  description: string;
  category: JobCategory | null;
  payment: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  conditions: string;
  neighborhood: string;
  address: string;
  pin: PinPoint | null;
  photos: PhotoDraft[];
}

export type JobFormField = keyof JobFormValues;
export type JobFormErrors = Partial<Record<JobFormField, string>>;

export const EMPTY_FORM: JobFormValues = {
  title: '',
  description: '',
  category: null,
  payment: '',
  date: '',
  startTime: '',
  endTime: '',
  conditions: '',
  neighborhood: '',
  address: '',
  pin: null,
  photos: [],
};

/** Inserta ':' mientras se escribe: "0900" -> "09:00". */
export function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Inserta '-' mientras se escribe: "20261125" -> "2026-11-25". */
export function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

/** Hermosillo no tiene horario de verano: UTC-7 todo el año. */
export function hermosilloNow(now: Date = new Date()): { date: string; time: string } {
  const iso = new Date(now.getTime() - 7 * 3600 * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function quickDates(now: Date = new Date()): Array<{ id: string; label: string; value: string }> {
  const today = hermosilloNow(now).date;
  return [
    { id: 'today', label: 'Hoy', value: today },
    { id: 'tomorrow', label: 'Mañana', value: addDays(today, 1) },
    { id: 'plus2', label: 'En 2 días', value: addDays(today, 2) },
  ];
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Acepta "750", "750.5" y "1,250.50". Devuelve null si no es un monto con máximo 2 decimales. */
export function parsePayment(value: string): number | null {
  const clean = value.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Number(clean);
}

export interface FeeBreakdown {
  jobAmount: number;
  fee: number;
  total: number;
}

/** Desglose RF-17. Aritmética en centavos enteros para que coincida con el redondeo de la base. */
export function feeBreakdown(amount: number): FeeBreakdown {
  const cents = Math.round(amount * 100);
  const feeCents = Math.floor((cents * FEE_RATE_PERCENT + 50) / 100);
  return { jobAmount: cents / 100, fee: feeCents / 100, total: (cents + feeCents) / 100 };
}

export function pinToCoords(pin: PinPoint): { latitude: number; longitude: number } {
  const x = Math.min(1, Math.max(0, pin.x));
  const y = Math.min(1, Math.max(0, pin.y));
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    latitude: round(PIN_BBOX.north - y * (PIN_BBOX.north - PIN_BBOX.south)),
    longitude: round(PIN_BBOX.west + x * (PIN_BBOX.east - PIN_BBOX.west)),
  };
}

/** Inverso de pinToCoords; null si el punto cae fuera de la zona de referencia. */
export function coordsToPin(latitude: number, longitude: number): PinPoint | null {
  const { north, south, west, east } = PIN_BBOX;
  if (latitude > north || latitude < south || longitude < west || longitude > east) return null;
  return {
    x: (longitude - west) / (east - west),
    y: (north - latitude) / (north - south),
  };
}

export function validatePhoto(photo: PhotoDraft): string | null {
  if (!(PHOTO_MIMES as readonly string[]).includes(photo.mimeType)) return 'Solo se aceptan fotos JPG o PNG.';
  if (photo.sizeBytes <= 0) return 'No se pudo leer el tamaño de la foto.';
  if (photo.sizeBytes > MAX_PHOTO_BYTES) return 'Cada foto debe pesar máximo 10 MB.';
  return null;
}

export function validateJobForm(values: JobFormValues, now: Date = new Date()): JobFormErrors {
  const errors: JobFormErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Escribe un título.';
  else if (title.length > TITLE_MAX) errors.title = `Máximo ${TITLE_MAX} caracteres.`;

  if (!values.category) errors.category = 'Elige una categoría.';

  const description = values.description.trim();
  if (!description) errors.description = 'Describe las actividades.';
  else if (description.length > DESCRIPTION_MAX) errors.description = `Máximo ${DESCRIPTION_MAX} caracteres.`;

  const payment = parsePayment(values.payment);
  if (payment === null) errors.payment = 'Escribe un monto válido, con máximo 2 decimales.';
  else if (payment < MIN_PAYMENT) errors.payment = 'El pago mínimo es $10.00 MXN.';
  else if (payment > MAX_PAYMENT) errors.payment = 'El pago máximo es $100,000.00 MXN.';

  const nowLocal = hermosilloNow(now);
  const dateOk = isValidDate(values.date);
  if (!dateOk) errors.date = 'Usa el formato AAAA-MM-DD.';
  else if (values.date < nowLocal.date) errors.date = 'La fecha no puede ser anterior a hoy.';

  const startOk = isValidTime(values.startTime);
  const endOk = isValidTime(values.endTime);
  if (!startOk) errors.startTime = 'Usa el formato HH:MM.';
  if (!endOk) errors.endTime = 'Usa el formato HH:MM.';
  if (startOk && endOk && values.endTime <= values.startTime) {
    errors.endTime = 'La hora de fin debe ser posterior al inicio (mismo día).';
  }
  if (dateOk && startOk && !errors.date && `${values.date} ${values.startTime}` <= `${nowLocal.date} ${nowLocal.time}`) {
    errors.startTime = 'El inicio debe ser posterior a este momento.';
  }

  if (values.conditions.trim().length > CONDITIONS_MAX) errors.conditions = `Máximo ${CONDITIONS_MAX} caracteres.`;

  const neighborhood = values.neighborhood.trim();
  if (!neighborhood) errors.neighborhood = 'Escribe la colonia o localidad.';
  else if (neighborhood.length > NEIGHBORHOOD_MAX) errors.neighborhood = `Máximo ${NEIGHBORHOOD_MAX} caracteres.`;

  const address = values.address.trim();
  if (!address) errors.address = 'Escribe el domicilio o referencia exacta.';
  else if (address.length > ADDRESS_MAX) errors.address = `Máximo ${ADDRESS_MAX} caracteres.`;

  if (!values.pin) errors.pin = 'Toca el mapa para marcar el punto exacto.';

  if (values.photos.length > MAX_PHOTOS) errors.photos = `Máximo ${MAX_PHOTOS} fotos.`;
  else {
    const bad = values.photos.map(validatePhoto).find((e) => e);
    if (bad) errors.photos = bad;
  }
  return errors;
}

export function hasErrors(errors: JobFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Solo con un formulario ya validado. */
export function toSaveParams(values: JobFormValues): SaveJobParams {
  const payment = parsePayment(values.payment);
  if (payment === null || !values.category || !values.pin) throw new Error('ERR_FORM_INVALID');
  const { latitude, longitude } = pinToCoords(values.pin);
  const conditions = values.conditions.trim();
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    paymentMxn: payment,
    jobDate: values.date,
    startTime: `${values.startTime}:00`,
    endTime: `${values.endTime}:00`,
    conditions: conditions ? conditions : null,
    neighborhood: values.neighborhood.trim(),
    exactAddress: values.address.trim(),
    exactLatitude: latitude,
    exactLongitude: longitude,
  };
}

/** Valores iniciales para editar una publicación existente (RF-06). */
export function valuesFromJob(job: Job, priv: JobPrivate | null): JobFormValues {
  return {
    title: job.title,
    description: job.description,
    category: job.category,
    payment: String(job.fixed_payment_mxn),
    date: job.job_date,
    startTime: job.start_time.slice(0, 5),
    endTime: job.end_time.slice(0, 5),
    conditions: job.conditions ?? '',
    neighborhood: job.neighborhood,
    address: priv?.exact_address ?? '',
    pin: priv ? coordsToPin(priv.exact_latitude, priv.exact_longitude) : null,
    photos: [],
  };
}

/** Errores de create_job / update_job traducidos para el usuario. */
export function saveErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('ERR_DATE_IN_PAST')) return 'El inicio del trabajo ya pasó. Elige una fecha y hora futuras.';
  if (raw.includes('ERR_NEIGHBORHOOD_REQUIRED')) return 'Escribe la colonia o localidad.';
  if (raw.includes('ERR_ACCOUNT_RESTRICTED')) return 'Tu cuenta no puede publicar por ahora.';
  if (raw.includes('ERR_JOB_NOT_EDITABLE')) return 'Esta publicación ya no se puede editar.';
  if (raw.includes('check_payment_range')) return 'El pago debe estar entre $10.00 y $100,000.00 MXN.';
  if (raw.includes('check_time_order')) return 'La hora de fin debe ser posterior al inicio.';
  if (raw.includes('ERR_FORBIDDEN')) return 'No tienes permiso para esta acción.';
  return 'No se pudo guardar la publicación. Intenta de nuevo.';
}
