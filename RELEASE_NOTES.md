Release: v1.0.8-stable-2025-11-29
Date: 2025-11-29

Summary:
- Stable snapshot after Requests UI, profile fixes, and server-side improvements.
- Server handler `EMAILS/server/list-manager-requests.js` updated to prefer service key and reliably return requester profile fields (embedding + fallback merge).
- Client `containers/requests` UI redesigned: single-line request rows, Confirm/Refuse button coloring and layout, Close button fixed width and right-aligned.
- Added migration `migrations/005_add_fk_manager_requests_profiles.sql` to add FK for reliable embedding (conditional, safe).
- Various bugfixes and logging improvements for debugging Supabase REST responses.

Notes for deploy:
- Apply `migrations/005_add_fk_manager_requests_profiles.sql` to the database (run as DB owner).
- Ensure `SUPABASE_KEY` (service role key) is present in server env for embedding/fallback queries.
- Redeploy server functions (Vercel) and verify `manager_requests_list_attempt_failed` / `manager_requests_profiles_fetch_failed` logs no longer appear.

Files added/changed in this snapshot:
- VERSION (this file)
- RELEASE_NOTES.md (this file)
- EMAILS/server/list-manager-requests.js (handler changes)
- EMAILS/server/manager-requests.js (related server changes)
- containers/requests/* (HTML, CSS, JS updates)
- migrations/005_add_fk_manager_requests_profiles.sql (migration)

If you want, I can also tag this commit with `v1.0.8-stable-2025-11-29` after pushing.
