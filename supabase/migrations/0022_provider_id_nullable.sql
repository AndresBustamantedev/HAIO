-- ============================================================
-- 0022 — provider_id nullable en integrations y external_resources
--
-- La columna provider_id referenciaba public.providers(id) como NOT NULL,
-- pero la lógica del conector se identifica por connector_type. El vínculo
-- con providers es opcional (se puede asignar manualmente más adelante).
-- ============================================================

ALTER TABLE public.integrations
  ALTER COLUMN provider_id DROP NOT NULL;

ALTER TABLE public.external_resources
  ALTER COLUMN provider_id DROP NOT NULL;
