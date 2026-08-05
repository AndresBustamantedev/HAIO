-- 0037 · milestone_deliverables — checklist de entregables por hito

CREATE TABLE public.milestone_deliverables (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  milestone_id    uuid        NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  status          text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','done')),
  due_date        date,
  completed_at    timestamptz,
  external_url    text,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.milestone_deliverables (milestone_id);

CREATE TRIGGER trg_milestone_deliverables_updated_at
  BEFORE UPDATE ON public.milestone_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.milestone_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY deliverables_select ON public.milestone_deliverables FOR SELECT
  USING (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

CREATE POLICY deliverables_insert ON public.milestone_deliverables FOR INSERT
  WITH CHECK (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

CREATE POLICY deliverables_update ON public.milestone_deliverables FOR UPDATE
  USING  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  WITH CHECK (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

CREATE POLICY deliverables_delete ON public.milestone_deliverables FOR DELETE
  USING  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

NOTIFY pgrst, 'reload schema';
