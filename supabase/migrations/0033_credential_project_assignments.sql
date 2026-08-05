-- Junction table: credentials ↔ projects (many-to-many)
-- A single credential (e.g. a license key) can be shared across multiple
-- projects of the same client without duplicating the record.

CREATE TABLE credential_project_assignments (
  credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (credential_id, project_id)
);

ALTER TABLE credential_project_assignments ENABLE ROW LEVEL SECURITY;

-- Staff: full access if they belong to the credential's organization
CREATE POLICY "org_members_manage_credential_project_assignments"
  ON credential_project_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM credentials c
      JOIN organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = credential_project_assignments.credential_id
        AND om.user_id = auth.uid()
    )
  );
