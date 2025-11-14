-- SQL migration: create profiles and relationships tables for Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rel_type text,
  created_at timestamptz DEFAULT now()
);
