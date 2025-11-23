Emails module (SendGrid + Mailtrap)
=================================

This folder contains a small email sending scaffold used by Supabase Edge Functions.

Files/structure:
- `server/sendEmail.js` - provider-agnostic helper used by server code
- `server/provider/sendgrid.js` - SendGrid wrapper (requires `@sendgrid/mail`)
- `server/provider/mailtrap.js` - Mailtrap wrapper using `nodemailer` for local testing
- `server/templates/` - HTML/text email templates (`manager_notification`, `manager_validated`)
- `.env.example` - example env vars
- `test/sendEmail.local.js` - local runner for quick checks (uses env vars)

Quick start (development, Mailtrap):
1. Create a Mailtrap inbox and copy credentials to your `.env` file
2. Set `EMAIL_PROVIDER=mailtrap` and provide `MAILTRAP_USER`/`MAILTRAP_PASS`
3. Run `node emails/test/sendEmail.local.js` to send a test message

Quick start (prototype, SendGrid single-sender):
1. Sign in to SendGrid and verify a single sender email (your `EMAIL_FROM_ADDRESS`)
2. Create an API key with Mail Send permission and set `SENDGRID_API_KEY` in secrets
3. Set `EMAIL_PROVIDER=sendgrid` in your Edge Function environment

Security:
- Never commit API keys. Put `SENDGRID_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in your project secret store.
- Tokens are single-use and should be stored as SHA-256 hashes in the DB (see migration).

Templates:
- `manager_notification.html` expects `validateLink`, `requesterName`, `requesterEmail`, `managerEmail`, `expiresAt`, `managerName`.
- `manager_validated.html` expects `requesterName`, `managerName`, `managerEmail`, `validatedAt`.
Emails module

Purpose
- Centralize email templates and sending logic for application-level notifications (welcome, manager notifications, profile-updated, migration invites).

Security
- All secrets (API keys) must be stored server-side as environment variables. Do not expose keys to the browser.

Env vars
- EMAIL_PROVIDER (sendgrid|smtp)
- SENDGRID_API_KEY
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- EMAIL_FROM_ADDRESS
- EMAIL_FROM_NAME
- EMAIL_ALLOWED_ORIGINS

Files
- client_shim.js — client-side shim calling the server endpoint.
- server/sendEmail.js — provider-agnostic sendEmail(templateName,to,vars).
- server/provider/sendgrid.js — SendGrid implementation.
- server/templates/*.html — email HTML templates.
- test/sendEmail.local.js — local test runner.

Usage
- Deploy `emails/server` as a serverless function or Node service.
- Client calls `/api/send-email` (POST) with JSON { template: string, to: string, vars: object }.
- The server validates origin and sends the requested template.
