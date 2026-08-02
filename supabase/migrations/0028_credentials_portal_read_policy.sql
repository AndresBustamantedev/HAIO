-- Allow portal users to read credentials shared with their client
CREATE POLICY "credentials_select_portal_client" ON credentials
  FOR SELECT
  USING (
    is_shared_with_client = true
    AND client_id IN (
      SELECT client_id
      FROM client_portal_access
      WHERE user_id = auth.uid()
    )
  );
