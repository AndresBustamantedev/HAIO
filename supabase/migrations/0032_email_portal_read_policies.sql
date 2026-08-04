-- Allow portal users to read email services shared with their client
CREATE POLICY "email_services_select_portal_client" ON public.email_services
  FOR SELECT
  USING (
    visible_in_portal = true
    AND client_id IN (
      SELECT client_id
      FROM public.client_portal_access
      WHERE user_id = auth.uid()
    )
  );

-- Allow portal users to read email accounts from visible services
CREATE POLICY "email_accounts_select_portal_client" ON public.email_accounts
  FOR SELECT
  USING (
    email_service_id IN (
      SELECT id
      FROM public.email_services
      WHERE visible_in_portal = true
        AND client_id IN (
          SELECT client_id
          FROM public.client_portal_access
          WHERE user_id = auth.uid()
        )
    )
  );
