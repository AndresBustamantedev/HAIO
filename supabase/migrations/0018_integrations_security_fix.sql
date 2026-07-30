-- ============================================================
-- 0018 — Corrección de seguridad: begin_integration_sync
--
-- El advisor detectó que begin_integration_sync es SECURITY DEFINER
-- y cualquier rol (incluido anon) puede ejecutarla via REST API.
-- Solo los usuarios autenticados con la sesión activa deben invocarla.
-- ============================================================

-- Revocar acceso al rol público (cubre anon y cualquier otro rol heredado)
revoke execute on function public.begin_integration_sync(uuid, uuid, integer) from public;
revoke execute on function public.begin_integration_sync(uuid, uuid, integer) from anon;

-- Asegurarse de que solo authenticated puede invocarla
grant execute on function public.begin_integration_sync(uuid, uuid, integer) to authenticated;
