-- DDL for quote_logs table (Supabase / Postgres)
CREATE TABLE IF NOT EXISTS public.quote_logs (
  id bigserial PRIMARY KEY,
  name text,
  company text,
  email text,
  phone text,
  service text,
  message text,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);
