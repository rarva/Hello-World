-- migration: create manager_requests table
-- Columns:
-- id (uuid primary key), requester_id (uuid), manager_email (text), token_hash (text), expires_at (timestamptz), status (text), created_at (timestamptz)
CREATE TABLE IF NOT EXISTS manager_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  manager_email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional index for lookup by token_hash
CREATE INDEX IF NOT EXISTS idx_manager_requests_token_hash ON manager_requests (token_hash);
