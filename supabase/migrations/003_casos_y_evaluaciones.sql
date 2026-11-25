-- =============================================================================
-- 003_casos_y_evaluaciones.sql
-- Parte 1 de las funciones restantes: respuesta a la finalizacion, apertura de
-- casos (ticket / reclamacion / reporte) y evaluaciones.
-- Requiere 001_trabajos_temporales.sql (y 002_storage.sql ya aplicadas).
-- Ejecutar completo en el SQL Editor de Supabase. Es seguro volver a ejecutarlo
-- (CREATE OR REPLACE), salvo el indice unico de reportes, que usa IF NOT EXISTS.
-- =============================================================================

-- Un mismo usuario no puede tener dos reportes abiertos sobre el mismo objeto.
CREATE UNIQUE INDEX IF NOT EXISTS one_open_report_per_target
    ON public.cases (reporter_id, target_type, target_id)
    WHERE case_type = 'report' AND status IN ('pending', 'in_review');

-- -----------------------------------------------------------------------------
-- Interna: inicia una reclamacion (RF-25). Congela el trabajo y el pago.
-- No es invocable desde el cliente (schema app, sin GRANT).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.start_claim(p_job uuid, p_reporter uuid, p_description text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    j public.jobs%ROWTYPE;
    pay public.payments%ROWTYPE;
    v_case uuid;
BEGIN
    SELECT * INTO j FROM public.jobs WHERE id = p_job FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
    IF j.status = 'in_claim' OR EXISTS (SELECT 1 FROM public.cases c
                                         WHERE c.job_id = p_job AND c.case_type = 'claim' AND c.status <> 'closed') THEN
        RAISE EXCEPTION 'ERR_CLAIM_EXISTS';
    END IF;
    IF j.status NOT IN ('in_progress', 'completion_requested') THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    SELECT * INTO pay FROM public.payments WHERE job_id = p_job FOR UPDATE;
    IF NOT FOUND OR pay.status <> 'transfer_pending' THEN RAISE EXCEPTION 'ERR_NO_PAYMENT'; END IF;

    PERFORM set_config('app.action_method', 'claim_opened', true);
    INSERT INTO public.cases (case_type, status, source, reporter_id, job_id, reported_user_id, description)
    VALUES ('claim', 'open', 'user', p_reporter, p_job,
            CASE WHEN p_reporter = j.employer_id THEN j.selected_worker_id ELSE j.employer_id END,
            p_description)
    RETURNING id INTO v_case;
    UPDATE public.jobs SET status = 'in_claim' WHERE id = p_job;
    UPDATE public.payments SET status = 'in_claim' WHERE id = pay.id;
    RETURN v_case;
END;
$$;

-- -----------------------------------------------------------------------------
-- Respuesta del empleador a la finalizacion sin codigo (RF-23, RF-24, D-04).
-- p_accept = true  -> el trabajo queda Completado (la transferencia la ejecuta la Edge Function).
-- p_accept = false -> se abre una reclamacion (requiere descripcion); devuelve el id del caso.
-- Si el empleador no responde en 24 h, expire_overdue() acepta automaticamente.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_completion(p_job uuid, p_accept boolean, p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    j public.jobs%ROWTYPE;
    v_desc text := btrim(coalesce(p_description, ''));
BEGIN
    IF NOT app.can_write() THEN RAISE EXCEPTION 'ERR_ACCOUNT_RESTRICTED'; END IF;
    SELECT * INTO j FROM public.jobs WHERE id = p_job FOR UPDATE;
    IF NOT FOUND OR j.employer_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF j.status <> 'completion_requested' OR j.completion_method IS DISTINCT FROM 'without_code' THEN
        RAISE EXCEPTION 'ERR_INVALID_STATE';
    END IF;
    IF p_accept IS NULL THEN RAISE EXCEPTION 'ERR_INVALID_INPUT'; END IF;
    IF p_accept THEN
        PERFORM set_config('app.action_method', 'employer_confirmation', true);
        UPDATE public.jobs SET status = 'completed' WHERE id = p_job;
        RETURN NULL;
    END IF;
    IF length(v_desc) < 10 OR length(v_desc) > 2000 THEN RAISE EXCEPTION 'ERR_INVALID_DESCRIPTION'; END IF;
    RETURN app.start_claim(p_job, j.employer_id, v_desc);
END;
$$;

-- -----------------------------------------------------------------------------
-- Apertura de casos (RF-25, RF-27, RF-28).
--  ticket : p_category obligatoria; p_job opcional (si se da, el usuario debe ser parte).
--  claim  : p_job obligatorio; empleador o trabajador seleccionado; trabajo En curso o Finalizacion solicitada.
--  report : p_target_type + p_target_id obligatorios; no se puede reportar a si mismo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.open_case(
    p_type case_type, p_description text,
    p_job uuid DEFAULT NULL, p_category ticket_category DEFAULT NULL,
    p_target_type report_target DEFAULT NULL, p_target_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_desc text := btrim(coalesce(p_description, ''));
    v_case uuid;
    v_reported uuid;
    j public.jobs%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'ERR_NOT_AUTHENTICATED'; END IF;
    IF app.my_role() NOT IN ('employer', 'worker') THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF NOT app.can_write() THEN RAISE EXCEPTION 'ERR_ACCOUNT_RESTRICTED'; END IF;
    IF length(v_desc) < 10 OR length(v_desc) > 2000 THEN RAISE EXCEPTION 'ERR_INVALID_DESCRIPTION'; END IF;

    IF p_type = 'claim' THEN
        IF p_job IS NULL THEN RAISE EXCEPTION 'ERR_INVALID_INPUT'; END IF;
        SELECT * INTO j FROM public.jobs WHERE id = p_job;
        IF NOT FOUND OR NOT (j.employer_id = v_uid OR j.selected_worker_id = v_uid) THEN
            RAISE EXCEPTION 'ERR_FORBIDDEN';
        END IF;
        RETURN app.start_claim(p_job, v_uid, v_desc);

    ELSIF p_type = 'ticket' THEN
        IF p_category IS NULL THEN RAISE EXCEPTION 'ERR_INVALID_INPUT'; END IF;
        IF p_job IS NOT NULL THEN
            SELECT * INTO j FROM public.jobs WHERE id = p_job;
            IF NOT FOUND OR NOT (j.employer_id = v_uid OR j.selected_worker_id = v_uid OR app.has_applied(p_job)) THEN
                RAISE EXCEPTION 'ERR_FORBIDDEN';
            END IF;
        END IF;
        INSERT INTO public.cases (case_type, status, source, reporter_id, job_id, ticket_category, description)
        VALUES ('ticket', 'open', 'user', v_uid, p_job, p_category, v_desc)
        RETURNING id INTO v_case;
        RETURN v_case;

    ELSIF p_type = 'report' THEN
        IF p_target_type IS NULL OR p_target_id IS NULL THEN RAISE EXCEPTION 'ERR_INVALID_INPUT'; END IF;
        CASE p_target_type
            WHEN 'user' THEN
                SELECT id INTO v_reported FROM public.profiles WHERE id = p_target_id;
            WHEN 'job' THEN
                SELECT employer_id INTO v_reported FROM public.jobs WHERE id = p_target_id;
            WHEN 'application' THEN
                SELECT worker_id INTO v_reported FROM public.job_applications WHERE id = p_target_id;
            WHEN 'review' THEN
                SELECT reviewer_id INTO v_reported FROM public.reviews WHERE id = p_target_id;
            WHEN 'chat_message' THEN
                SELECT m.sender_id INTO v_reported FROM public.chat_messages m
                 JOIN public.jobs jj ON jj.id = m.job_id
                 WHERE m.id = p_target_id AND (m.worker_id = v_uid OR jj.employer_id = v_uid);
        END CASE;
        IF v_reported IS NULL THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
        IF v_reported = v_uid THEN RAISE EXCEPTION 'ERR_SELF_REPORT'; END IF;
        IF EXISTS (SELECT 1 FROM public.cases c WHERE c.reporter_id = v_uid AND c.case_type = 'report'
                    AND c.target_type = p_target_type AND c.target_id = p_target_id
                    AND c.status IN ('pending', 'in_review')) THEN
            RAISE EXCEPTION 'ERR_ALREADY_REPORTED';
        END IF;
        INSERT INTO public.cases (case_type, status, source, reporter_id, reported_user_id, target_type, target_id, description)
        VALUES ('report', 'pending', 'user', v_uid, v_reported, p_target_type, p_target_id, v_desc)
        RETURNING id INTO v_case;
        RETURN v_case;
    END IF;
    RAISE EXCEPTION 'ERR_INVALID_INPUT';
END;
$$;

-- -----------------------------------------------------------------------------
-- Evaluacion (RF-31): 1 a 5 y comentario opcional, una por persona y trabajo
-- Completado. Solo participan empleador y trabajador seleccionado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_review(p_job uuid, p_rating int, p_comment text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_uid uuid := auth.uid();
    j public.jobs%ROWTYPE;
    v_other uuid;
    v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
    v_id uuid;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'ERR_NOT_AUTHENTICATED'; END IF;
    IF NOT app.can_write() THEN RAISE EXCEPTION 'ERR_ACCOUNT_RESTRICTED'; END IF;
    SELECT * INTO j FROM public.jobs WHERE id = p_job;
    IF NOT FOUND OR NOT (j.employer_id = v_uid OR j.selected_worker_id = v_uid) THEN
        RAISE EXCEPTION 'ERR_FORBIDDEN';
    END IF;
    IF j.status <> 'completed' THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'ERR_INVALID_RATING'; END IF;
    IF v_comment IS NOT NULL AND length(v_comment) > 500 THEN RAISE EXCEPTION 'ERR_INVALID_COMMENT'; END IF;
    v_other := CASE WHEN v_uid = j.employer_id THEN j.selected_worker_id ELSE j.employer_id END;
    IF v_other IS NULL THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    IF EXISTS (SELECT 1 FROM public.reviews WHERE job_id = p_job AND reviewer_id = v_uid) THEN
        RAISE EXCEPTION 'ERR_ALREADY_REVIEWED';
    END IF;
    INSERT INTO public.reviews (job_id, reviewer_id, reviewee_id, rating, comment)
    VALUES (p_job, v_uid, v_other, p_rating, v_comment)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Permisos: las funciones nuevas nacen con EXECUTE para PUBLIC; se revoca aqui.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION app.start_claim(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.respond_completion(uuid, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.open_case(case_type, text, uuid, ticket_category, report_target, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_review(uuid, int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_completion(uuid, boolean, text),
    public.open_case(case_type, text, uuid, ticket_category, report_target, uuid),
    public.submit_review(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION app.start_claim(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.respond_completion(uuid, boolean, text),
    public.open_case(case_type, text, uuid, ticket_category, report_target, uuid),
    public.submit_review(uuid, int, text) TO service_role;
