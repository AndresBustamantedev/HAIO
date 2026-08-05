-- ─────────────────────────────────────────────────────────────────────────────
-- 0036 · project_milestones — modelo completo (reemplaza project_billing_milestones)
-- Los datos se copian desde project_billing_milestones con los mismos UUIDs.
-- La FK de project_expenses.milestone_id se redirige a esta tabla.
-- project_billing_milestones se mantiene para rollback; se eliminará en 0039.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nuevos tipos ENUM
CREATE TYPE milestone_work_status AS ENUM (
  'draft', 'planned', 'in_progress', 'in_review', 'completed', 'cancelled'
);

CREATE TYPE milestone_billing_status AS ENUM (
  'unbilled', 'invoice_draft', 'invoiced', 'partially_paid', 'paid', 'credited', 'cancelled'
);

CREATE TYPE milestone_billing_trigger AS ENUM (
  'manual', 'project_created', 'scheduled_date', 'milestone_completed', 'client_approved'
);

-- 2. Tabla principal
CREATE TABLE public.project_milestones (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id           uuid        NOT NULL REFERENCES public.projects(id)      ON DELETE RESTRICT,
  client_id            uuid        REFERENCES public.clients(id) ON DELETE SET NULL,
  name                 text        NOT NULL,
  description          text,
  client_description   text,
  type                 text        NOT NULL DEFAULT 'development'
                         CHECK (type IN ('development','maintenance','extra','renewal','other')),
  work_status          milestone_work_status    NOT NULL DEFAULT 'draft',
  billing_status       milestone_billing_status NOT NULL DEFAULT 'unbilled',
  billing_trigger      milestone_billing_trigger NOT NULL DEFAULT 'manual',
  amount               numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency_code        text        NOT NULL DEFAULT 'EUR',
  tax_rate             numeric(5,2) DEFAULT 21.00,
  internal_cost        numeric(12,2),
  billing_interval     text,
  planned_date         date,
  billed_at            date,
  completed_at         timestamptz,
  planned_invoice_date date,
  estimated_cost       numeric(12,2),
  actual_cost          numeric(12,2),
  estimated_hours      numeric(8,2),
  actual_hours         numeric(8,2),
  sort_order           integer     NOT NULL DEFAULT 0,
  assigned_to          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes                text,
  internal_notes       text,
  created_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  cancelled_at         timestamptz,
  deleted_at           timestamptz
);

-- 3. Índices
CREATE INDEX ON public.project_milestones (project_id) WHERE deleted_at IS NULL;
CREATE INDEX ON public.project_milestones (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX ON public.project_milestones (billing_status) WHERE deleted_at IS NULL;
CREATE INDEX ON public.project_milestones (work_status) WHERE deleted_at IS NULL;
CREATE INDEX ON public.project_milestones (sort_order, created_at);

-- 4. Trigger updated_at
CREATE TRIGGER trg_project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Migrar datos desde project_billing_milestones (mismos UUIDs → FK de project_expenses no rompe)
INSERT INTO public.project_milestones (
  id, organization_id, project_id, client_id,
  name, type,
  work_status, billing_status,
  amount, currency_code, internal_cost, billing_interval,
  planned_date, billed_at,
  notes, sort_order, created_at
)
SELECT
  id,
  organization_id,
  project_id,
  client_id,
  name,
  CASE type
    WHEN 'desarrollo'    THEN 'development'
    WHEN 'mantenimiento' THEN 'maintenance'
    WHEN 'extra'         THEN 'extra'
    WHEN 'renovacion'    THEN 'renewal'
    ELSE 'other'
  END,
  CASE status
    WHEN 'borrador'      THEN 'draft'::milestone_work_status
    WHEN 'presupuestado' THEN 'planned'::milestone_work_status
    WHEN 'facturado'     THEN 'completed'::milestone_work_status
    WHEN 'cobrado'       THEN 'completed'::milestone_work_status
    ELSE 'draft'::milestone_work_status
  END,
  CASE status
    WHEN 'borrador'      THEN 'unbilled'::milestone_billing_status
    WHEN 'presupuestado' THEN 'unbilled'::milestone_billing_status
    WHEN 'facturado'     THEN 'invoiced'::milestone_billing_status
    WHEN 'cobrado'       THEN 'paid'::milestone_billing_status
    ELSE 'unbilled'::milestone_billing_status
  END,
  amount, currency_code, internal_cost, billing_interval,
  due_date, billed_at,
  notes,
  (ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at))::integer - 1,
  created_at
FROM public.project_billing_milestones
WHERE deleted_at IS NULL;

-- 6. Redirigir FK de project_expenses a la nueva tabla
--    Los UUIDs son los mismos, así que no hay conflictos de integridad.
ALTER TABLE public.project_expenses
  DROP CONSTRAINT IF EXISTS project_expenses_milestone_id_fkey;

ALTER TABLE public.project_expenses
  ADD CONSTRAINT project_expenses_milestone_id_fkey
  FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE SET NULL;

-- 7. RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY milestones_select ON public.project_milestones FOR SELECT
  USING (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

CREATE POLICY milestones_insert ON public.project_milestones FOR INSERT
  WITH CHECK (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

CREATE POLICY milestones_update ON public.project_milestones FOR UPDATE
  USING  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

CREATE POLICY milestones_delete ON public.project_milestones FOR DELETE
  USING  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

NOTIFY pgrst, 'reload schema';
