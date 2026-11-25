-- =============================================================================
-- 004_objecion_y_administracion.sql
-- Parte 2 de las funciones restantes: mensajes de caso, objecion (RF-25),
-- panel administrativo (asignar, resolver, moderar, sancionar) y baja logica.
-- Requiere 001, 002 y 003 aplicadas.
-- Seguro de volver a ejecutar (CREATE OR REPLACE / IF NOT EXISTS / DROP TRIGGER IF EXISTS).
-- =============================================================================

ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS objected_at TIMESTAMPTZ;   -- una sola objecion por caso

-- -----------------------------------------------------------------------------
-- Interna: al CERRARSE una reclamacion se aplica la decision al trabajo y al pago.
-- Se dispara tanto por el cierre automatico (cron, 7 dias sin objecion) como por cualquier otro cierre.
--  transfer_full  -> pago Pendiente de transferencia, trabajo Completado.
--  refund_full    -> trabajo Cancelado; el pago queda En reclamacion hasta que la Edge Function
--                    ejecute el reembolso y lo marque Reembolsado o Reembolso fallido.
--  partial        -> pago Liquidacion parcial pendiente, trabajo Completado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.apply_claim_decision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    j public.jobs%ROWTYPE;
BEGIN
    SELECT * INTO j FROM public.jobs WHERE id = NEW.job_id FOR UPDATE;
    IF NOT FOUND OR j.status <> 'in_claim' OR NEW.decision IS NULL THEN RETURN NEW; END IF;   -- idempotente
    PERFORM set_config('app.action_method', 'claim_decision', true);
    IF NEW.decision = 'transfer_full' THEN
        UPDATE public.payments SET status = 'transfer_pending' WHERE job_id = NEW.job_id AND status = 'in_claim';
        UPDATE public.jobs SET status = 'completed' WHERE id = NEW.job_id;
    ELSIF NEW.decision = 'refund_full' THEN
        UPDATE public.jobs SET status = 'cancelled' WHERE id = NEW.job_id;
    ELSE
        UPDATE public.payments SET status = 'partial_settlement_pending' WHERE job_id = NEW.job_id AND status = 'in_claim';
        UPDATE public.jobs SET status = 'completed' WHERE id = NEW.job_id;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_cases_apply_decision ON public.cases;
CREATE TRIGGER trg_cases_apply_decision AFTER UPDATE OF status ON public.cases
    FOR EACH ROW WHEN (NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' AND NEW.case_type = 'claim')
    EXECUTE FUNCTION app.apply_claim_decision();

-- -----------------------------------------------------------------------------
-- Interna: baja de una cuenta (baja logica). Cancela publicaciones abiertas y
-- retira postulaciones pendientes; los datos se conservan.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.deactivate_user(p_user uuid, p_status account_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    r record;
BEGIN
    PERFORM set_config('app.action_method', 'account_deactivation', true);
    FOR r IN SELECT id FROM public.jobs WHERE employer_id = p_user AND status IN ('published', 'has_applications') FOR UPDATE LOOP
        UPDATE public.job_applications SET status = 'rejected' WHERE job_id = r.id AND status = 'pending';
        UPDATE public.jobs SET status = 'cancelled' WHERE id = r.id;
    END LOOP;
    UPDATE public.job_applications SET status = 'withdrawn' WHERE worker_id = p_user AND status = 'pending';
    UPDATE public.profiles SET account_status = p_status, suspended_until = NULL WHERE id = p_user;
END;
$$;

-- Baja logica por el propio usuario. No se permite con trabajos activos o casos abiertos.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'ERR_NOT_AUTHENTICATED'; END IF;
    IF app.my_role() NOT IN ('employer', 'worker') THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF NOT app.can_write() THEN RAISE EXCEPTION 'ERR_ACCOUNT_RESTRICTED'; END IF;
    IF EXISTS (SELECT 1 FROM public.jobs j
                WHERE (j.employer_id = v_uid OR j.selected_worker_id = v_uid)
                  AND j.status IN ('assigned', 'arrival_registered', 'in_progress', 'completion_requested', 'in_claim'))
       OR EXISTS (SELECT 1 FROM public.cases c WHERE c.reporter_id = v_uid AND c.case_type IN ('ticket', 'claim')
                   AND c.status <> 'closed') THEN
        RAISE EXCEPTION 'ERR_ACTIVE_OBLIGATIONS';
    END IF;
    PERFORM app.deactivate_user(v_uid, 'soft_deleted');
END;
$$;

-- -----------------------------------------------------------------------------
-- Mensajes de caso. Las partes escriben mensajes visibles; el admin tambien notas internas.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_case_message(p_case uuid, p_body text, p_internal boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    c public.cases%ROWTYPE;
    v_body text := btrim(coalesce(p_body, ''));
    v_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'ERR_NOT_AUTHENTICATED'; END IF;
    IF NOT app.can_write() THEN RAISE EXCEPTION 'ERR_ACCOUNT_RESTRICTED'; END IF;
    IF NOT app.can_see_case(p_case) THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    SELECT * INTO c FROM public.cases WHERE id = p_case;
    IF c.status IN ('closed', 'attended', 'dismissed') THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    IF p_internal AND NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF length(v_body) < 1 OR length(v_body) > 4000 THEN RAISE EXCEPTION 'ERR_INVALID_MESSAGE'; END IF;
    INSERT INTO public.case_messages (case_id, author_id, body, is_internal)
    VALUES (p_case, auth.uid(), v_body, coalesce(p_internal, false)) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- Objecion (RF-25): dentro de los 7 dias posteriores a la resolucion, una de las partes
-- puede objetar UNA vez; el caso vuelve a En revision y se detiene el cierre automatico.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.object_case(p_case uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    c public.cases%ROWTYPE;
    v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'ERR_NOT_AUTHENTICATED'; END IF;
    IF app.my_role() NOT IN ('employer', 'worker') THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF NOT app.can_write() THEN RAISE EXCEPTION 'ERR_ACCOUNT_RESTRICTED'; END IF;
    SELECT * INTO c FROM public.cases WHERE id = p_case FOR UPDATE;
    IF NOT FOUND OR NOT app.can_see_case(p_case) THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF c.case_type = 'report' OR c.status <> 'resolved' THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    IF c.auto_close_deadline IS NULL OR c.auto_close_deadline <= now() THEN RAISE EXCEPTION 'ERR_OBJECTION_WINDOW_CLOSED'; END IF;
    IF c.objected_at IS NOT NULL THEN RAISE EXCEPTION 'ERR_ALREADY_OBJECTED'; END IF;
    IF length(v_reason) < 10 OR length(v_reason) > 2000 THEN RAISE EXCEPTION 'ERR_INVALID_DESCRIPTION'; END IF;
    PERFORM set_config('app.action_method', 'objection', true);
    INSERT INTO public.case_messages (case_id, author_id, body) VALUES (p_case, auth.uid(), v_reason);
    UPDATE public.cases SET status = 'in_review', auto_close_deadline = NULL, objected_at = now() WHERE id = p_case;
END;
$$;

-- -----------------------------------------------------------------------------
-- Administracion. Todas exigen rol administrador activo.
-- -----------------------------------------------------------------------------
-- Tomar un caso (Abierto/Pendiente -> En revision).
CREATE OR REPLACE FUNCTION public.admin_assign_case(p_case uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    c public.cases%ROWTYPE;
BEGIN
    IF NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    SELECT * INTO c FROM public.cases WHERE id = p_case FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
    IF c.status IN ('open', 'pending') THEN
        PERFORM set_config('app.action_method', 'admin', true);
        UPDATE public.cases SET status = 'in_review', assigned_admin_id = auth.uid() WHERE id = p_case;
    ELSIF c.status = 'in_review' AND c.assigned_admin_id IS NULL THEN
        UPDATE public.cases SET assigned_admin_id = auth.uid() WHERE id = p_case;
    ELSIF c.status = 'in_review' AND c.assigned_admin_id = auth.uid() THEN
        RETURN;   -- idempotente
    ELSE
        RAISE EXCEPTION 'ERR_INVALID_STATE';
    END IF;
END;
$$;

-- Resolver un ticket o una reclamacion (En revision -> Resuelto). Inicia el plazo de objecion de 7 dias.
-- Reclamacion: p_decision obligatoria. transfer_full y refund_full calculan los montos desde el pago;
-- partial exige p_transfer (monto para el trabajador) y el reembolso es el resto del total cobrado.
CREATE OR REPLACE FUNCTION public.admin_resolve_case(
    p_case uuid, p_notes text, p_decision case_decision DEFAULT NULL, p_transfer numeric DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    c public.cases%ROWTYPE;
    pay public.payments%ROWTYPE;
    v_notes text := btrim(coalesce(p_notes, ''));
    v_tr numeric; v_rf numeric;
BEGIN
    IF NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    SELECT * INTO c FROM public.cases WHERE id = p_case FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
    IF c.case_type = 'report' THEN RAISE EXCEPTION 'ERR_USE_CLOSE_REPORT'; END IF;
    IF c.status <> 'in_review' OR c.assigned_admin_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    IF length(v_notes) < 10 OR length(v_notes) > 4000 THEN RAISE EXCEPTION 'ERR_INVALID_NOTES'; END IF;

    IF c.case_type = 'claim' THEN
        IF p_decision IS NULL THEN RAISE EXCEPTION 'ERR_DECISION_REQUIRED'; END IF;
        SELECT * INTO pay FROM public.payments WHERE job_id = c.job_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NO_PAYMENT'; END IF;
        IF p_decision = 'transfer_full' THEN v_tr := pay.job_amount_mxn; v_rf := 0;
        ELSIF p_decision = 'refund_full' THEN v_tr := 0; v_rf := pay.total_charged_mxn;
        ELSE
            IF p_transfer IS NULL THEN RAISE EXCEPTION 'ERR_DECISION_AMOUNTS'; END IF;
            v_tr := round(p_transfer, 2); v_rf := pay.total_charged_mxn - v_tr;
        END IF;
    ELSIF p_decision IS NOT NULL THEN
        RAISE EXCEPTION 'ERR_DECISION_NOT_ALLOWED';
    END IF;

    PERFORM set_config('app.action_method', 'admin', true);
    UPDATE public.cases SET status = 'resolved', decision = p_decision,
           approved_transfer_amount = v_tr, approved_refund_amount = v_rf,
           resolution_notes = v_notes, resolved_at = now(), auto_close_deadline = now() + INTERVAL '7 days'
     WHERE id = p_case;
END;
$$;

-- Cerrar un reporte (En revision -> Atendido | Descartado).
CREATE OR REPLACE FUNCTION public.admin_close_report(p_case uuid, p_outcome text, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    c public.cases%ROWTYPE;
    v_notes text := btrim(coalesce(p_notes, ''));
BEGIN
    IF NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF p_outcome NOT IN ('attended', 'dismissed') THEN RAISE EXCEPTION 'ERR_INVALID_INPUT'; END IF;
    SELECT * INTO c FROM public.cases WHERE id = p_case FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
    IF c.case_type <> 'report' OR c.status <> 'in_review' OR c.assigned_admin_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'ERR_INVALID_STATE';
    END IF;
    IF length(v_notes) < 10 OR length(v_notes) > 4000 THEN RAISE EXCEPTION 'ERR_INVALID_NOTES'; END IF;
    PERFORM set_config('app.action_method', 'admin', true);
    UPDATE public.cases SET status = p_outcome::case_status, resolution_notes = v_notes, resolved_at = now(), closed_at = now()
     WHERE id = p_case;
END;
$$;

-- Moderacion de contenido (RF-29, UI-ADM-05): ocultar, eliminar, restaurar o descartar.
-- Aplica a publicaciones, evaluaciones y mensajes de chat. Usuarios y postulaciones se tratan con sanciones.
CREATE OR REPLACE FUNCTION public.admin_moderate(
    p_target_type report_target, p_target_id uuid, p_action text, p_reason text, p_case uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_reason text := btrim(coalesce(p_reason, ''));
    v_status moderation_status;
    v_n int := 0;
    v_id uuid;
BEGIN
    IF NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF p_action NOT IN ('hide', 'remove', 'restore', 'dismiss') THEN RAISE EXCEPTION 'ERR_INVALID_INPUT'; END IF;
    IF length(v_reason) < 10 OR length(v_reason) > 2000 THEN RAISE EXCEPTION 'ERR_INVALID_NOTES'; END IF;
    IF p_target_type NOT IN ('job', 'review', 'chat_message') THEN RAISE EXCEPTION 'ERR_USE_SANCTION'; END IF;
    IF p_case IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.cases WHERE id = p_case AND assigned_admin_id = auth.uid()) THEN
        RAISE EXCEPTION 'ERR_FORBIDDEN';
    END IF;
    v_status := CASE p_action WHEN 'hide' THEN 'hidden' WHEN 'remove' THEN 'removed' ELSE 'visible' END;

    IF p_target_type = 'job' THEN
        IF p_action = 'dismiss' THEN v_n := (SELECT count(*) FROM public.jobs WHERE id = p_target_id);
        ELSE UPDATE public.jobs SET moderation_status = v_status WHERE id = p_target_id; GET DIAGNOSTICS v_n = ROW_COUNT; END IF;
    ELSIF p_target_type = 'review' THEN
        IF p_action = 'dismiss' THEN v_n := (SELECT count(*) FROM public.reviews WHERE id = p_target_id);
        ELSE UPDATE public.reviews SET moderation_status = v_status WHERE id = p_target_id; GET DIAGNOSTICS v_n = ROW_COUNT; END IF;
    ELSE
        IF p_action = 'dismiss' THEN v_n := (SELECT count(*) FROM public.chat_messages WHERE id = p_target_id);
        ELSE UPDATE public.chat_messages SET moderation_status = v_status WHERE id = p_target_id; GET DIAGNOSTICS v_n = ROW_COUNT; END IF;
    END IF;
    IF v_n = 0 THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;

    INSERT INTO public.moderation_actions (admin_id, case_id, target_type, target_id, action, reason)
    VALUES (auth.uid(), p_case, p_target_type, p_target_id, p_action, v_reason) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- Sancion a un usuario (RF-30). Una sancion por llamada; queda en user_sanctions.
CREATE OR REPLACE FUNCTION public.admin_sanction(p_user uuid, p_sanction sanction_type, p_reason text, p_case uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    u public.profiles%ROWTYPE;
    v_reason text := btrim(coalesce(p_reason, ''));
    v_exp timestamptz;
    v_id uuid;
BEGIN
    IF NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF length(v_reason) < 10 OR length(v_reason) > 2000 THEN RAISE EXCEPTION 'ERR_INVALID_NOTES'; END IF;
    SELECT * INTO u FROM public.profiles WHERE id = p_user FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
    IF u.role = 'admin' OR u.id = auth.uid() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    IF u.account_status IN ('blocked', 'soft_deleted') THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    IF p_case IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.cases WHERE id = p_case AND assigned_admin_id = auth.uid()) THEN
        RAISE EXCEPTION 'ERR_FORBIDDEN';
    END IF;

    v_exp := CASE p_sanction WHEN 'suspension_1d' THEN now() + INTERVAL '1 day'
                             WHEN 'suspension_7d' THEN now() + INTERVAL '7 days'
                             WHEN 'suspension_30d' THEN now() + INTERVAL '30 days' END;
    INSERT INTO public.user_sanctions (user_id, admin_id, sanction, reason, case_id, expires_at)
    VALUES (p_user, auth.uid(), p_sanction, v_reason, p_case, v_exp) RETURNING id INTO v_id;

    IF p_sanction = 'warning' THEN
        UPDATE public.profiles SET account_status = 'warned' WHERE id = p_user AND account_status = 'active';
    ELSIF p_sanction IN ('suspension_1d', 'suspension_7d', 'suspension_30d') THEN
        UPDATE public.profiles SET account_status = 'suspended', suspended_until = v_exp WHERE id = p_user;
    ELSIF p_sanction = 'permanent_block' THEN
        UPDATE public.profiles SET account_status = 'blocked', suspended_until = NULL WHERE id = p_user;
    ELSE
        PERFORM app.deactivate_user(p_user, 'soft_deleted');
    END IF;
    RETURN v_id;
END;
$$;

-- Revocar una sancion. La baja logica no es revocable. El estado de la cuenta se recalcula.
CREATE OR REPLACE FUNCTION public.admin_revoke_sanction(p_sanction uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    s public.user_sanctions%ROWTYPE;
    v_status account_status;
    v_until timestamptz;
BEGIN
    IF NOT app.is_admin() THEN RAISE EXCEPTION 'ERR_FORBIDDEN'; END IF;
    SELECT * INTO s FROM public.user_sanctions WHERE id = p_sanction FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND'; END IF;
    IF s.sanction = 'soft_delete' THEN RAISE EXCEPTION 'ERR_NOT_REVOCABLE'; END IF;
    IF s.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'ERR_INVALID_STATE'; END IF;
    UPDATE public.user_sanctions SET revoked_at = now() WHERE id = p_sanction;

    IF EXISTS (SELECT 1 FROM public.user_sanctions WHERE user_id = s.user_id AND revoked_at IS NULL AND sanction = 'permanent_block') THEN
        v_status := 'blocked';
    ELSE
        SELECT max(expires_at) INTO v_until FROM public.user_sanctions
         WHERE user_id = s.user_id AND revoked_at IS NULL AND expires_at > now() AND sanction IN ('suspension_1d', 'suspension_7d', 'suspension_30d');
        IF v_until IS NOT NULL THEN v_status := 'suspended';
        ELSIF EXISTS (SELECT 1 FROM public.user_sanctions WHERE user_id = s.user_id AND revoked_at IS NULL AND sanction = 'warning') THEN v_status := 'warned';
        ELSE v_status := 'active'; END IF;
    END IF;
    UPDATE public.profiles SET account_status = v_status, suspended_until = v_until
     WHERE id = s.user_id AND account_status <> 'soft_deleted';
END;
$$;

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION app.apply_claim_decision(), app.deactivate_user(uuid, account_status) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_my_account(), public.add_case_message(uuid, text, boolean),
    public.object_case(uuid, text), public.admin_assign_case(uuid),
    public.admin_resolve_case(uuid, text, case_decision, numeric), public.admin_close_report(uuid, text, text),
    public.admin_moderate(report_target, uuid, text, text, uuid),
    public.admin_sanction(uuid, sanction_type, text, uuid), public.admin_revoke_sanction(uuid)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account(), public.add_case_message(uuid, text, boolean),
    public.object_case(uuid, text), public.admin_assign_case(uuid),
    public.admin_resolve_case(uuid, text, case_decision, numeric), public.admin_close_report(uuid, text, text),
    public.admin_moderate(report_target, uuid, text, text, uuid),
    public.admin_sanction(uuid, sanction_type, text, uuid), public.admin_revoke_sanction(uuid)
    TO authenticated;
GRANT EXECUTE ON FUNCTION app.apply_claim_decision(), app.deactivate_user(uuid, account_status) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_my_account(), public.add_case_message(uuid, text, boolean),
    public.object_case(uuid, text), public.admin_assign_case(uuid),
    public.admin_resolve_case(uuid, text, case_decision, numeric), public.admin_close_report(uuid, text, text),
    public.admin_moderate(report_target, uuid, text, text, uuid),
    public.admin_sanction(uuid, sanction_type, text, uuid), public.admin_revoke_sanction(uuid)
    TO service_role;
