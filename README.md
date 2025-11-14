# Hello-World
Rhomberg OrgChart
Company's colors #DA162A #EB8318 #010101

## Supabase + GitHub Pages (Safer Deploy)

This project supports a low-cost, safe deployment pattern where runtime Supabase keys
are injected at build time by GitHub Actions. The repo should never contain `service_role`
keys or any admin credentials.

Quick setup:

- Create a free project at https://supabase.com and note the `Project URL` and the
	`anon` key (NOT the service_role key).
- In the Supabase dashboard -> SQL Editor, run `migrations/001_create_profiles.sql` to
	create the `profiles` and `relationships` tables.
- In your GitHub repository, go to Settings -> Secrets -> Actions and add two secrets:
	- `SUPABASE_URL` = your Supabase project URL
	- `SUPABASE_ANON_KEY` = your anon key
- Commit and push your repo to the `main` branch. The workflow `.github/workflows/deploy.yml`
	will generate a `config.js` from Secrets and deploy the repo to GitHub Pages.

Security notes:
- Do NOT commit a `config.js` containing keys. Use the generated `config.js` provided by
	the Actions workflow (the file is added at runtime and is ignored by `.gitignore`).
- For public demos, ensure Row Level Security (RLS) policies in Supabase restrict access
	as appropriate. By default, tables may be open for reads/writes—configure policies to
	allow only authenticated users to insert/select/modify their rows.

Local development:
- If you want to test locally without Actions, create a `config.js` in the repo root with:
	```js
	window.SUPABASE_URL = 'https://your-project.supabase.co';
	window.SUPABASE_ANON_KEY = 'your-anon-key';
	```
	Do NOT commit this file—it's for local testing only.

Migration & import:
- If you have existing users stored in localStorage, use `migrate_users.js` to import them.
	This script requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (the service_role key)
	as environment variables and must be run locally.
