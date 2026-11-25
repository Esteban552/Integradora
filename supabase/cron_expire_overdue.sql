-- Programa la función public.expire_overdue() para que corra cada minuto con pg_cron.
-- Este job ya fue creado a mano en el proyecto de Supabase; el archivo queda como registro
-- y se puede volver a correr sin duplicar el job.
-- Requiere la extensión pg_cron activa (Database > Extensions en Supabase).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-overdue') THEN
    PERFORM cron.unschedule('expire-overdue');
  END IF;
END
$$;

SELECT cron.schedule('expire-overdue', '* * * * *', 'SELECT public.expire_overdue()');
