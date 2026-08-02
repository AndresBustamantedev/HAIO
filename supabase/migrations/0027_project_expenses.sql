-- Gastos adicionales por proyecto (costes ad-hoc de último momento)
CREATE TABLE project_expenses (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid       NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id     uuid        NOT NULL REFERENCES projects(id)      ON DELETE CASCADE,
  description    text        NOT NULL,
  amount         numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency_code  text        NOT NULL DEFAULT 'EUR',
  category       text        NOT NULL DEFAULT 'other'
                   CHECK (category IN ('hosting','domain','license','tool','design','development','other')),
  incurred_at    date        NOT NULL DEFAULT CURRENT_DATE,
  notes          text,
  created_by     uuid        REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE INDEX ON project_expenses (project_id) WHERE deleted_at IS NULL;
CREATE INDEX ON project_expenses (organization_id);

CREATE TRIGGER set_updated_at_project_expenses
  BEFORE UPDATE ON project_expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON project_expenses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "expenses_insert" ON project_expenses FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "expenses_update" ON project_expenses FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "expenses_delete" ON project_expenses FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
  ));
