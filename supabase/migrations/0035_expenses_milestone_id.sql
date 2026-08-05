-- Vincular gastos a un hito de facturación (opcional)
ALTER TABLE project_expenses
  ADD COLUMN milestone_id uuid REFERENCES project_billing_milestones(id) ON DELETE SET NULL;

CREATE INDEX ON project_expenses (milestone_id) WHERE deleted_at IS NULL AND milestone_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
