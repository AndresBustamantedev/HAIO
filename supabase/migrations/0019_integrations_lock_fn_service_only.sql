-- ============================================================
-- 0019 — begin_integration_sync solo accesible por service_role
--
-- El SyncEngine llama a esta función siempre con el admin client
-- (service_role), nunca con la sesión del usuario autenticado.
-- El service_role tiene acceso total independientemente de los GRANTs.
-- Revocar de authenticated elimina el vector de acceso directo via REST.
-- ============================================================

revoke execute on function public.begin_integration_sync(uuid, uuid, integer) from authenticated;

-- El service_role puede ejecutar cualquier función sin GRANT explícito.
-- No se necesita ningún GRANT adicional.
