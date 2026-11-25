-- Verificación posterior a correr 001, 003 y 004 en Supabase real (la 002 se confirma aparte).
-- Pegar completo en el SQL Editor. Cada fila debe decir OK; cualquier FALLA se reporta a Isa.

WITH checks AS (
  -- 1. Las 22 tablas existen
  SELECT 'tablas en public = 22' AS prueba,
         (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') = 22 AS ok
  UNION ALL
  -- 2. Todas con RLS activa
  SELECT 'RLS activa en todas las tablas de public',
         NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity)
  UNION ALL
  -- 3. anon no puede ejecutar ninguna RPC de public
  SELECT 'anon sin EXECUTE en funciones de public',
         NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges
                      WHERE routine_schema='public' AND grantee IN ('anon','PUBLIC'))
  UNION ALL
  -- 4. anon no puede leer tablas de public
  SELECT 'anon sin SELECT en tablas de public',
         NOT EXISTS (SELECT 1 FROM information_schema.role_table_grants
                      WHERE table_schema='public' AND grantee='anon')
  UNION ALL
  -- 5. authenticated no puede escribir directo en las tablas sensibles
  SELECT 'authenticated sin INSERT/UPDATE/DELETE en jobs, payments, job_private, job_completion, cases, reviews',
         NOT EXISTS (SELECT 1 FROM information_schema.role_table_grants
                      WHERE table_schema='public' AND grantee='authenticated'
                        AND table_name IN ('jobs','payments','job_private','job_completion','cases','reviews')
                        AND privilege_type IN ('INSERT','UPDATE','DELETE'))
  UNION ALL
  -- 6. Las RPC de cliente existen (19)
  SELECT 'RPC de cliente presentes',
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname IN
           ('complete_profile','accept_terms','save_worker_location','create_job','update_job','cancel_job','search_jobs',
            'get_job_public','get_applicants','get_counterpart_contact','apply_to_job','withdraw_application','reject_application',
            'select_worker','confirm_conditions','register_arrival','request_completion','verify_completion_code','renew_completion_code')) = 19
  UNION ALL
  -- 7. Funciones de servicio solo para service_role
  SELECT 'service_confirm_payment y expire_overdue solo para service_role',
         NOT EXISTS (SELECT 1 FROM information_schema.routine_privileges
                      WHERE routine_schema='public' AND routine_name IN ('service_confirm_payment','expire_overdue')
                        AND grantee IN ('anon','authenticated','PUBLIC'))
  UNION ALL
  -- 8. Transiciones sembradas
  SELECT 'state_transitions con datos', (SELECT count(*) FROM public.state_transitions) > 40
  UNION ALL
  -- 9. Columnas generadas del pago
  SELECT 'payments.total_charged_mxn es columna generada',
         EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments'
                  AND column_name='total_charged_mxn' AND is_generated='ALWAYS')
  UNION ALL
  -- 10. Realtime publica chat y notificaciones
  SELECT 'Realtime: chat_messages y notifications publicadas',
         (SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public'
            AND tablename IN ('chat_messages','notifications')) = 2
  UNION ALL
  -- 11. RPC de la 003 y 004 presentes (12)
  SELECT 'RPC de 003 y 004 presentes (12)',
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname IN
           ('respond_completion','open_case','submit_review','delete_my_account','add_case_message','object_case',
            'admin_assign_case','admin_resolve_case','admin_close_report','admin_moderate','admin_sanction','admin_revoke_sanction')) = 12
  UNION ALL
  -- 12. Las 12 son ejecutables por authenticated
  SELECT 'authenticated puede ejecutar las 12 RPC nuevas',
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND has_function_privilege('authenticated', p.oid, 'EXECUTE') AND p.proname IN
           ('respond_completion','open_case','submit_review','delete_my_account','add_case_message','object_case',
            'admin_assign_case','admin_resolve_case','admin_close_report','admin_moderate','admin_sanction','admin_revoke_sanction')) = 12
  UNION ALL
  -- 13. Funciones internas del schema app no ejecutables por clientes
  SELECT 'app.start_claim, apply_claim_decision y deactivate_user no ejecutables por anon/authenticated',
         (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='app' AND p.proname IN ('start_claim','apply_claim_decision','deactivate_user')) = 3
         AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='app' AND p.proname IN ('start_claim','apply_claim_decision','deactivate_user')
             AND (has_function_privilege('anon', p.oid, 'EXECUTE') OR has_function_privilege('authenticated', p.oid, 'EXECUTE')))
  UNION ALL
  -- 14. Triggers e indices nuevos
  SELECT 'trigger de decision de reclamacion e indice de reportes presentes',
         EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_cases_apply_decision' AND NOT tgisinternal)
         AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='one_open_report_per_target')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cases' AND column_name='objected_at')
)
SELECT prueba, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS resultado FROM checks;
