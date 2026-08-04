ALTER TABLE public.email_accounts
  ADD COLUMN IF NOT EXISTS password_ciphertext bytea;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_accounts TO authenticated;
