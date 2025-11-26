# COPILOT GUIDE Addendum — v1.0.5 (2025-11-25)

This addendum contains version-specific developer guidance, release procedures, operational steps for SendGrid/hosting env updates, and quick examples for the `EMAILS` integration added in v1.0.5.

## Branching & Release Procedure (v1.0.5)
- Branch name: `v1.0.5` (or `v1.0.5-docs` if you prefer descriptive suffixes)
- Commit message convention for release: `v1.0.5: [short description] + docs`
- Tagging: `git tag -a v1.0.5 -m "Release v1.0.5"`
- Push flow:
  ```powershell
  git checkout -b v1.0.5
  git add docs/RELEASE_NOTES_v1.0.5.md docs/COPILOT_GUIDE_ADDENDUM_v1.0.5.md
  git commit -m "v1.0.5: docs addendum (release notes + copilot guide updates)"
  git tag -a v1.0.5 -m "Release v1.0.5"
  git push -u origin v1.0.5
  git push origin --tags
  ```

## EMAILS Integration (Developer Summary)
- Client API (browser): `window.emailClient.sendManagerNotification(payload)`
  - Payload shape example:
    ```javascript
    {
      to: 'manager@example.com',
      templateName: 'manager_notification', // alias OR template GUID
      data: { managerName: 'Jill', userName: 'Sam', company: 'Rhomberg' }
    }
    ```
  - Behavior: client gathers `access_token` from `window.supabase` and POSTs to `/api/send-manager-notification` with `Authorization: Bearer <token>`.

- Server (edge): `EMAILS/server/send-manager-notification.js`
  - Validates the Supabase JWT by calling `${SUPABASE_URL}/auth/v1/user` and includes `apikey` header when available.
  - If `templateName` looks like a GUID, the handler sets `template_id` in the SendGrid API call. If `templateName` is an alias, the handler falls back to using `html` content (from client-supplied rendered HTML or from `EMAILS/templates/manager_notification.html`).

## Updating SendGrid Key (Vercel example)
- Via dashboard: Project → Settings → Environment Variables → edit `SENDGRID_API_KEY` → redeploy
- Via CLI (recommended for automation):
  ```powershell
  vercel secrets add sendgrid-api-key-secret "sk_live_xxx..."
  vercel env add SENDGRID_API_KEY production
  # choose "Use existing secret" -> select the secret
  vercel --prod --yes
  ```

## Verifying the Handler in Production
1. Trigger the flow in the UI (onboarding or profile save).
2. Check logs:
  ```powershell
  vercel logs <project-name-or-url> --since 10m --prod
  ```
3. Expected log entries:
  - `POST /api/send-manager-notification 200` (or 202 from SendGrid) and a short success line
  - No tokens in logs; only non-sensitive debug (handler trimmed verbose output in v1.0.5)

## Troubleshooting Quick List
- SendGrid 4xx on send:
  - Verify `SENDGRID_API_KEY` value and `EMAIL_FROM` verified sender
  - Check SendGrid account for template GUIDs (if using templates)
- Supabase token validation failing:
  - Ensure `SUPABASE_ANON_KEY` is set in hosting env; handler sends `apikey` header for the auth call
- No email received:
  - Confirm the app attempted the send (see production logs)
  - Check SendGrid Activity / suppression lists / verified sender status

## Local testing tips
- To test locally without pushing envs to production, use a local environment variable in a PowerShell session:
  ```powershell
  $env:SENDGRID_API_KEY = 'sk_test_xxx'
  python -m http.server 8000
  # open http://localhost:8000 and exercise the UI
  ```
  This only affects your local session and is NOT committed.

## Follow-ups (optional)
- Add a scheduled CI/poller that validates any template GUIDs used by `EMAILS` exist in SendGrid (recommended if you move to template GUIDs permanently).
- Add a GitHub Action smoke-test that runs after deploy to trigger a test send to a monitored mailbox and fails the workflow if delivery or API responses are invalid.

---

_End of addendum for v1.0.5_
