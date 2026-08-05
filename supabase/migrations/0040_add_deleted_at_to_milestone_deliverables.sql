-- Add soft-delete support to milestone_deliverables
ALTER TABLE public.milestone_deliverables
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update RLS SELECT policy to exclude soft-deleted rows
DROP POLICY IF EXISTS deliverables_select ON public.milestone_deliverables;
CREATE POLICY deliverables_select ON public.milestone_deliverables
  FOR SELECT USING (
    deleted_at IS NULL
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
