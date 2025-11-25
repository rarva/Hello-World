# Release Notes — v1.0.5 (2025-11-25)

## Overview
This release consolidates the server-side email sending workflow, stabilizes the onboarding/profile notification integration, hardens auth validation for the edge handler, and updates developer documentation. It also includes operational guidance for updating SendGrid credentials and redeploying the production handler.

## Features & Improvements
- EMAILS area finalized: `EMAILS/server` (edge handler), `EMAILS/client` (browser wrapper), and `EMAILS/templates` (HTML fallback) are standardized and documented.
- Non-blocking notification sends wired from onboarding and profile save handlers (`containers/onboarding/onboarding_init.js`, `containers/user_profile/user_profile_init.js`).
- Edge handler robustified: Supabase token validation now supplies the `apikey` header when calling the Supabase auth endpoint; SendGrid payload logic falls back to inline HTML when `template_id` appears to be an alias instead of a GUID.
- Production deploy trimmed noisy debug logs and was re-deployed to ensure runtime matches repository state.

## Operational Notes (SendGrid & Env)
Environment variables required (set in hosting environment; do NOT commit):
- `SENDGRID_API_KEY` — SendGrid API key used by the edge handler
- `EMAIL_FROM` — Verified sender address used in outgoing messages
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon public key (used for server-side auth validation header)

If you rotate or change `SENDGRID_API_KEY`, update it in your hosting environment (Vercel shown as primary example) and then redeploy production. Quick CLI steps:

```powershell
# Add or update the key interactively
vercel env add SENDGRID_API_KEY production

# Or add as a secret and attach it
vercel secrets add sendgrid-api-key-secret "sk_live_xxx..."
vercel env add SENDGRID_API_KEY production
# choose 'Use existing secret' when prompted

# Trigger a production redeploy
vercel --prod --yes
```

## Smoke Test After Deploy
1. Create a test user in the app or use the onboarding flow to trigger a notification send.
2. Tail the production logs for `send-manager-notification` and watch for 2xx responses from SendGrid.

```powershell
vercel logs <project-name-or-url> --since 5m --prod
```

3. Confirm delivery in your test inbox. If SendGrid returns 401/403, verify `SENDGRID_API_KEY` is correct and `EMAIL_FROM` is a verified sender in SendGrid.

## Known Issues
- If `send-manager-notification` receives a `template_id` that is not a GUID (for example, friendly aliases), the handler will send the `html` fallback instead of attempting to use SendGrid templates. If you want template aliasing, create the transactional templates in SendGrid first and update client/server to use GUIDs, or reintroduce a server-side alias→GUID mapping.

## Tag
This commit is tagged as `v1.0.5` in the repository.
