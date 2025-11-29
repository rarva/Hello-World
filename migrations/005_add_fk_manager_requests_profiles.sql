-- migration: add foreign key from manager_requests.requester_id to profiles.id
-- Add the foreign key constraint only if it does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_manager_requests_requester'
  ) THEN
    ALTER TABLE public.manager_requests
      ADD CONSTRAINT fk_manager_requests_requester
      FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Ensure an index exists for requester_id to help joins
CREATE INDEX IF NOT EXISTS idx_manager_requests_requester_id ON public.manager_requests (requester_id);
