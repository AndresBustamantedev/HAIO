-- 0039 · Corregir permisos de acceso PostgREST para las tablas nuevas de hitos
-- Las tablas creadas en 0036/0037/0038 necesitan GRANT para los roles anon/authenticated.
-- Reemplazamos también las políticas RLS con el patrón probado de project_expenses.

-- ── GRANT ──────────────────────────────────────────────────────────────────
GRANT ALL ON public.project_milestones      TO anon, authenticated;
GRANT ALL ON public.milestone_deliverables  TO anon, authenticated;
GRANT ALL ON public.invoice_milestone_links TO anon, authenticated;

-- ── RLS project_milestones ─ reemplazar con patrón subquery probado ─────────
DROP POLICY IF EXISTS milestones_select ON public.project_milestones;
DROP POLICY IF EXISTS milestones_insert ON public.project_milestones;
DROP POLICY IF EXISTS milestones_update ON public.project_milestones;
DROP POLICY IF EXISTS milestones_delete ON public.project_milestones;

CREATE POLICY milestones_select ON public.project_milestones FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY milestones_insert ON public.project_milestones FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY milestones_update ON public.project_milestones FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY milestones_delete ON public.project_milestones FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- ── RLS milestone_deliverables ───────────────────────────────────────────────
DROP POLICY IF EXISTS deliverables_select ON public.milestone_deliverables;
DROP POLICY IF EXISTS deliverables_insert ON public.milestone_deliverables;
DROP POLICY IF EXISTS deliverables_update ON public.milestone_deliverables;
DROP POLICY IF EXISTS deliverables_delete ON public.milestone_deliverables;

CREATE POLICY deliverables_select ON public.milestone_deliverables FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY deliverables_insert ON public.milestone_deliverables FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY deliverables_update ON public.milestone_deliverables FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY deliverables_delete ON public.milestone_deliverables FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

-- ── RLS invoice_milestone_links ──────────────────────────────────────────────
DROP POLICY IF EXISTS iml_select ON public.invoice_milestone_links;
DROP POLICY IF EXISTS iml_insert ON public.invoice_milestone_links;
DROP POLICY IF EXISTS iml_update ON public.invoice_milestone_links;
DROP POLICY IF EXISTS iml_delete ON public.invoice_milestone_links;

CREATE POLICY iml_select ON public.invoice_milestone_links FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY iml_insert ON public.invoice_milestone_links FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY iml_update ON public.invoice_milestone_links FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY iml_delete ON public.invoice_milestone_links FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  ));

NOTIFY pgrst, 'reload schema';
