-- 002_storage.sql — Buckets y políticas de Storage (RF-04, RF-05, RF-23, RF-26, RNF-10).
-- Correr UNA vez en el SQL Editor de Supabase, después de 001_trabajos_temporales.sql.
--
-- Convención de rutas (la app debe respetarla; la política lo exige):
--   attachments:    <owner_uid>/<uuid>.<jpg|png|pdf>      (el mismo valor va en attachments.storage_path)
--   profile-photos: <owner_uid>/avatar.<jpg|png>          (el mismo valor va en profiles.photo_path)
-- Flujo de archivos de trabajo/caso: 1) subir a Storage  2) registrar la fila en public.attachments.
-- Quién puede VER un archivo lo decide la tabla attachments (sus políticas RLS), no Storage.

BEGIN;

-- Buckets privados, máximo 10 MB por archivo.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('attachments',    'attachments',    false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('profile-photos', 'profile-photos', false, 10485760, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---- attachments ----
-- Subir: solo dentro de la carpeta propia.
CREATE POLICY attachments_obj_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Leer: la carpeta propia, o cualquier archivo registrado en public.attachments que el usuario ya puede ver
-- (la subconsulta respeta las políticas RLS de attachments: dueño del trabajo, trabajador seleccionado, partes del caso, admin).
CREATE POLICY attachments_obj_select ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (SELECT 1 FROM public.attachments a WHERE a.storage_path = storage.objects.name)
    )
  );

-- Borrar: solo huérfanos propios (sin fila en attachments). Para quitar una foto de trabajo, primero se borra la fila.
CREATE POLICY attachments_obj_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND NOT EXISTS (SELECT 1 FROM public.attachments a WHERE a.storage_path = storage.objects.name)
  );

-- ---- profile-photos ----
-- Cualquier usuario con sesión puede ver fotos de perfil (nombre y foto ya son visibles entre las partes en la app).
CREATE POLICY profile_photos_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY profile_photos_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY profile_photos_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY profile_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

COMMIT;
