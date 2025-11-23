-- Migration: Create manager_validation_requests table
-- Version: v1.0.2-manager-validation

CREATE TABLE IF NOT EXISTS public.manager_validation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NULL,
  requester_email text NOT NULL,
  manager_email text NOT NULL,
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  manager_user_id uuid NULL,
  validated_at timestamptz NULL,
  requester_notified_at timestamptz NULL,
  meta jsonb NULL
);

CREATE INDEX IF NOT EXISTS idx_manager_validation_requests_token_hash ON public.manager_validation_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_manager_validation_requests_manager_email ON public.manager_validation_requests (manager_email);
CREATE INDEX IF NOT EXISTS idx_manager_validation_requests_requester_user_id ON public.manager_validation_requests (requester_user_id);

-- Note: tokens MUST be stored as SHA-256 hex; raw tokens are only included in emailed links.
