-- Add portal visibility flag to email_services
ALTER TABLE public.email_services
  ADD COLUMN IF NOT EXISTS visible_in_portal boolean NOT NULL DEFAULT false;
