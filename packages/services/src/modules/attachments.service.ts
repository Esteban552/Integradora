import { getServiceConfig } from '../config';
import type { UUID } from '../types/database';

export interface UploadPhotoInput {
  /** URI local del archivo (file://...). */
  uri: string;
  /** image/jpeg o image/png. */
  mimeType: string;
  sizeBytes: number;
  name: string;
}

/**
 * Archivos adjuntos (RF-05, S4). Reglas en 001/002: máximo 5 fotos por trabajo, 10 MB cada una,
 * solo JPG o PNG, bucket privado `attachments`, ruta `<owner_uid>/<uuid>.<jpg|png>`.
 */
export const attachmentsService = {
  /**
   * Sube una foto de apoyo de un trabajo y devuelve su ruta de Storage.
   *
   * Modo supabase (pendiente, Esteban): 1) subir el archivo al bucket `attachments` en la ruta
   * `<auth.uid()>/<uuid>.<ext>`; 2) insertar en `attachments` (kind 'job_photo', job_id, storage_path,
   * mime_type, size_bytes). La base rechaza más de 5 fotos por trabajo (ERR_ATTACHMENT_LIMIT).
   */
  async uploadJobPhoto(jobId: UUID, photo: UploadPhotoInput): Promise<string> {
    if (getServiceConfig().dataSource === 'mock') {
      const ext = photo.mimeType === 'image/png' ? 'png' : 'jpg';
      return `mock-owner/${jobId}-${photo.name.replace(/[^\w.-]/g, '_') || 'foto'}.${ext}`;
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },
};
