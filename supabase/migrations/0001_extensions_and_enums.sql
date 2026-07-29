-- Extensions
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Enums
create type organization_role as enum ('owner','admin','manager','member','viewer','client');
create type membership_status as enum ('invited','active','suspended','revoked');
create type client_status as enum ('lead','prospect','active','inactive','archived');
create type client_type as enum ('individual','company','association','other');
create type project_status as enum ('draft','planned','active','on_hold','completed','cancelled','archived');
create type project_type as enum ('website','ecommerce','landing_page','maintenance','redesign','seo','consulting','other');
create type service_category as enum ('development','design','hosting','domain','email','maintenance','seo','analytics','support','consulting','other');
create type service_billing_type as enum ('one_time','recurring','usage_based','free');
create type billing_interval as enum ('weekly','monthly','quarterly','semiannual','annual','biennial','custom');
create type domain_status as enum ('pending','active','expired','transferred','cancelled','unknown');
create type hosting_status as enum ('pending','active','suspended','expired','cancelled');
create type credential_type as enum ('website_admin','hosting_panel','domain_registrar','ftp','sftp','ssh','database','email','api','social_media','analytics','other');
create type quote_status as enum ('draft','sent','viewed','accepted','rejected','expired','cancelled');
create type invoice_status as enum ('draft','issued','sent','viewed','partially_paid','paid','overdue','void','refunded');
create type payment_status as enum ('pending','processing','succeeded','failed','cancelled','refunded','partially_refunded');
create type payment_method_type as enum ('bank_transfer','card','cash','paypal','stripe','direct_debit','other');
create type subscription_status as enum ('trialing','active','past_due','paused','cancelled','expired');
create type task_status as enum ('backlog','todo','in_progress','blocked','review','done','cancelled');
create type task_priority as enum ('low','medium','high','urgent');
create type ticket_status as enum ('open','in_progress','waiting_client','waiting_internal','resolved','closed','cancelled');
create type ticket_priority as enum ('low','normal','high','urgent');
create type notification_type as enum ('system','renewal','payment','invoice','task','ticket','backup','security','other');
create type notification_channel as enum ('in_app','email','push','webhook');
create type backup_status as enum ('pending','running','successful','failed','cancelled');
create type document_category as enum ('contract','quote','invoice','receipt','brief','report','credential_export','legal','other');
create type credential_access_action as enum ('view','copy','update','rotate');
