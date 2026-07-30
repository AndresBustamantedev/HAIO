-- ============================================================
-- 0021 — integration_secrets: acceso exclusivo a service_role
--
-- Problema detectado tras 0020:
--   authenticated conserva INSERT, UPDATE, DELETE directos sobre
--   integration_secrets, lo que permite manipular secretos cifrados
--   via /rest/v1/integration_secrets sin pasar por las Server Actions.
--
-- Solución:
--   1. Revocar ALL de authenticated (y reforzar revocación de anon/public)
--   2. Eliminar las políticas RLS de INSERT, UPDATE, DELETE
--      (ya no hay rol de usuario con privilegios directos)
--   3. Corregir los privilegios por defecto del esquema public
--      (postgres grantor tiene ALL para anon y authenticated en futuras tablas)
--
-- Resultado:
--   · anon          → sin acceso
--   · authenticated → sin acceso
--   · service_role  → acceso completo (bypasses RLS por diseño de Supabase)
--   · La UI accede via:
--       - v_integrations_safe          → lista secretos configurados (solo tipo)
--       - get_integration_configured_secrets() → función SECURITY DEFINER
--   · Escrituras de secretos exclusivamente via Server Actions que:
--       (a) validan sesión, org, rol e integración con createClient()
--       (b) usan createAdminClient() (service_role) para el INSERT real
-- ============================================================

-- ── 1. Revocar todos los privilegios directos sobre integration_secrets ─────
-- anon ya fue revocado en 0020; se incluye aquí por completitud y defensa
-- en profundidad, por si la plataforma regenera grants entre migraciones.
revoke all on public.integration_secrets from anon;
revoke all on public.integration_secrets from authenticated;
revoke all on public.integration_secrets from public;

-- ── 2. Eliminar las políticas RLS de escritura ──────────────────────────────
-- Con REVOKE completo el motor PostgreSQL rechaza cualquier operación DML
-- de anon/authenticated antes de evaluar RLS.
-- Las políticas son redundantes y amplían la superficie de ataque auditable.
drop policy if exists integration_secrets_delete_privileged on public.integration_secrets;
drop policy if exists integration_secrets_insert_privileged on public.integration_secrets;
drop policy if exists integration_secrets_update_privileged on public.integration_secrets;

-- ── 3. Corregir privilegios por defecto del esquema public ──────────────────
-- Estado detectado: el grantor postgres tiene arwdDxtm (ALL) como default
-- para anon y authenticated. Toda tabla nueva hereda ese acceso completo.
--
-- Este cambio es prospectivo: no afecta a tablas ya creadas (sus grants
-- explícitos permanecen). Solo impide que futuras tablas hereden ALL
-- automáticamente. Las nuevas migraciones deben añadir GRANTs explícitos.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;

alter default privileges for role postgres in schema public
  revoke all on tables from authenticated;

-- Lo mismo para secuencias (evitar acceso a nextval/setval desde la API)
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;

alter default privileges for role postgres in schema public
  revoke all on sequences from authenticated;

-- Nota sobre supabase_admin:
-- supabase_admin también tiene defaults equivalentes (arwdDxtm para anon
-- y authenticated). Esos pueden ser regenerados por la plataforma.
-- La protección definitiva para tablas sensibles reside en:
--   (a) REVOKE explícito en su propia migración (como el paso 1 de arriba)
--   (b) RLS habilitado con políticas restrictivas (o sin políticas = deny-all)
