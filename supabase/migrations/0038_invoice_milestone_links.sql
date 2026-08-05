-- 0038 · invoice_milestone_links — relación muchos-a-muchos hitos ↔ facturas
--         Reemplaza el FK directo invoice_id en project_billing_milestones.
--         También añade milestone_id en invoice_items para trazabilidad por línea.

-- 1. Tabla de vínculos
CREATE TABLE public.invoice_milestone_links (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  invoice_id      uuid        NOT NULL REFERENCES public.invoices(id)          ON DELETE RESTRICT,
  milestone_id    uuid        NOT NULL REFERENCES public.project_milestones(id) ON DELETE RESTRICT,
  amount          numeric(12,2) NOT NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invoice_id, milestone_id)
);

CREATE INDEX ON public.invoice_milestone_links (milestone_id);
CREATE INDEX ON public.invoice_milestone_links (invoice_id);

-- 2. RLS
ALTER TABLE public.invoice_milestone_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY iml_select ON public.invoice_milestone_links FOR SELECT
  USING (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

CREATE POLICY iml_insert ON public.invoice_milestone_links FOR INSERT
  WITH CHECK (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

CREATE POLICY iml_update ON public.invoice_milestone_links FOR UPDATE
  USING  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

CREATE POLICY iml_delete ON public.invoice_milestone_links FOR DELETE
  USING  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- 3. Migrar vínculos existentes desde project_billing_milestones.invoice_id
INSERT INTO public.invoice_milestone_links (organization_id, invoice_id, milestone_id, amount)
SELECT
  pbm.organization_id,
  pbm.invoice_id,
  pm.id,
  pm.amount
FROM public.project_billing_milestones pbm
INNER JOIN public.project_milestones pm ON pm.id = pbm.id
WHERE pbm.invoice_id IS NOT NULL
  AND pbm.deleted_at IS NULL
ON CONFLICT (invoice_id, milestone_id) DO NOTHING;

-- 4. milestone_id en invoice_items para trazabilidad por línea
ALTER TABLE public.invoice_items
  ADD COLUMN milestone_id uuid REFERENCES public.project_milestones(id) ON DELETE SET NULL;

CREATE INDEX ON public.invoice_items (milestone_id) WHERE milestone_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
