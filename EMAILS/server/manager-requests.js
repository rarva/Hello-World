export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS)
  });
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// fetch wrapper with timeout (Edge supports AbortController)
async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, Object.assign({}, options, { signal: controller.signal }));
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function sha256Base64Url(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  // base64url
  let b64 = btoa(String.fromCharCode(...bytes));
  b64 = b64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return b64;
}

export default async function handler(req) {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

    let body;
    try { body = await req.json(); } catch (e) { return jsonResponse({ error: 'invalid_json' }, 400); }

    const { manager_email, user_id, userName, managerName, company } = body || {};
    if (!isValidEmail(manager_email)) return jsonResponse({ error: 'invalid_manager_email' }, 400);

    // Design decision: this send endpoint is best-effort and does not require
    // the caller to present a Supabase JWT. The server will still attempt to
    // insert a manager_requests row (using provided `user_id` if available),
    // but will not block the email send if DB insert or auth lookup fails.
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;

    // Generate a single-use token and its hash
    const rand = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(rand).map(b => ('00' + b.toString(16)).slice(-2)).join('');
    const tokenHash = await sha256Base64Url(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days
    // Friendly, date-only string for emails (e.g. "Nov 30, 2025")
    const formatDateShort = (iso) => {
      try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
      } catch (e) { return String(iso).split('T')[0]; }
    };
    const expiresDate = formatDateShort(expiresAt);

    // Attempt to insert into Supabase REST using provided `user_id` (best-effort).
    // If `user_id` is not supplied we will still send the email but record a
    // request with null requester_id so admins can later inspect.
    const requesterId = (body && body.user_id) ? String(body.user_id) : null;
    if (supabaseUrl) {
      try {
        console.info('manager-requests: inserting_manager_request (best-effort)');
        const insertRes = await fetchWithTimeout(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests`, {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
          body: JSON.stringify({ requester_id: requesterId, manager_email, token_hash: tokenHash, expires_at: expiresAt, status: 'pending' })
        }, 10000);
        console.info('manager-requests: manager_requests_insert_response', { status: insertRes.status });
        if (!insertRes.ok) {
          console.warn('manager-requests: manager_requests_insert_failed', { status: insertRes.status });
        } else {
          console.info('manager-requests: manager_requests_inserted', { status: insertRes.status });
        }
      } catch (e) {
        console.warn('manager-requests: manager_requests_insert_error', e && (e.name || e.message));
      }
    }

    // Attempt to resolve the requester's email (if not provided in payload)
    // The onboarding flow may not pass `userEmail`, so try to lookup from profiles table.
    let requesterEmail = (body && (body.userEmail || body.user_email)) || null;
    if (!requesterEmail && requesterId && supabaseUrl) {
      try {
        const qUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(requesterId)}&select=email`;
        const qRes = await fetchWithTimeout(qUrl, { method: 'GET', headers: Object.assign({ Accept: 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {}) }, 7000);
        if (qRes && qRes.ok) {
          const j = await qRes.json().catch(() => null);
          if (Array.isArray(j) && j.length > 0 && j[0].email) requesterEmail = j[0].email;
        }
      } catch (e) { /* ignore lookup failure - it's best-effort */ }
    }
    // Ensure body.userEmail is available for template substitutions
    try { if (!body) body = {}; body.userEmail = requesterEmail || (body.userEmail || body.user_email || ''); } catch (e) {}

    // Build validate link
    // Determine a usable base URL for the validate link. Prefer explicit env var;
    // fallback to request headers so preview emails contain absolute links.
    let baseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
    if (!baseUrl) {
      try {
        const proto = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol') || 'https';
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
        if (host) baseUrl = `${proto}://${host}`;
      } catch (e) { baseUrl = ''; }
    }
    // Build a login-first link: direct the manager to the app login with
    // their email prefilled and a return_to that will open the Requests
    // container after sign-in. We also include `force_signout=1` so that
    // if the manager clicks the link from a browser that has an existing
    // session (e.g. the newly onboarded user), the client can sign out
    // the current session and show the login form prefilled for the
    // manager. This prevents landing the manager inside another user's
    // active session.
    const returnPath = `/?open_requests=1`;
    const validateLink = `${(baseUrl || '').replace(/\/$/, '')}/?prefill_email=${encodeURIComponent(manager_email)}&force_signout=1&return_to=${encodeURIComponent(returnPath)}`;

    // Send the email using SendGrid. Prefer rendering the canonical server-side
    // template `EMAILS/templates/manager_notification.html` from the app host.
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    if (!sendgridKey || !emailFrom) return jsonResponse({ error: 'email_service_not_configured' }, 500);

    // Attempt to fetch the canonical template from the app. If that fails,
    // fall back to a minimal inline HTML body.
    let htmlBody = null;
    try {
      if (baseUrl) {
        const tplUrl = `${(baseUrl || '').replace(/\/$/, '')}/EMAILS/templates/manager_notification.html`;
        const tplRes = await fetchWithTimeout(tplUrl, {}, 7000);
        if (tplRes.ok) {
          let tplText = await tplRes.text();
          // resolve Handlebars-style conditional for managerName if present in template
          // replace the whole block {{#if managerName}}...{{else}}...{{/if}} with managerName or empty string
          try {
            if (!managerName || !String(managerName).trim()) {
              tplText = tplText.replace(/\{\{\#if\s+managerName\}\}[\s\S]*?\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '');
              tplText = tplText.replace(/\{\{\#if\s+managerName\}\}[\s\S]*?\{\{\/if\}\}/g, '');
            } else {
              tplText = tplText.replace(/\{\{\#if\s+managerName\}\}[\s\S]*?\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, managerName);
              tplText = tplText.replace(/\{\{\#if\s+managerName\}\}([\s\S]*?)\{\{\/if\}\}/g, managerName);
            }
          } catch (e) { /* ignore conditional parsing errors */ }

          // simple HTML escape to avoid accidental injection
          const esc = (s) => String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          tplText = tplText.replace(/\{\{\s*validateLink\s*\}\}/g, esc(validateLink))
            .replace(/\{\{\s*userName\s*\}\}/g, esc(userName || ''))
            .replace(/\{\{\s*managerName\s*\}\}/g, esc(managerName || ''))
            .replace(/\{\{\s*company\s*\}\}/g, esc(company || ''))
            .replace(/\{\{\s*expiresAt\s*\}\}/g, esc(expiresAt || ''))
            .replace(/\{\{\s*expiresDate\s*\}\}/g, esc(expiresDate || ''))
            .replace(/\{\{\s*userEmail\s*\}\}/g, esc(body.userEmail || ''))
            .replace(/\{\{\s*supportEmail\s*\}\}/g, esc(process.env.SUPPORT_EMAIL || 'rarva@hotmail.com'));
          htmlBody = tplText;
        }
      }
    } catch (e) {
      console.warn('manager-requests: fetch_template_failed', e && (e.name || e.message));
    }

    if (!htmlBody) {
      const safeManagerName = managerName && String(managerName).trim() ? String(managerName).trim() : '';
      const safeUserName = userName && String(userName).trim() ? String(userName).trim() : '';
      const subject = safeUserName ? `${safeUserName} request validation.` : 'Manager notification';
      const greeting = safeManagerName ? `Hello ${safeManagerName},` : 'Hello,';
      htmlBody = `${greeting}<br/><br/><strong>${safeUserName || ''}</strong> has been added as a direct report to ${company || ''}.<br/><br/>` +
        `<a href=\"${validateLink}\" style=\"display:inline-block;padding:10px 14px;background:#DA162A;color:#fff;border-radius:10px;text-decoration:none;font-weight:600\">Review & Validate</a>` +
        `<div style=\"margin-top:12px;font-size:12px;color:#666\">If the button above does not work, open this link in your browser:<br/><a href=\"${validateLink}\">${validateLink}</a></div>` +
        `<p style=\"color:#666;font-size:12px\">This link expires on ${expiresDate}</p>`;
    }

    const safeSubject = (userName && String(userName).trim()) ? `${String(userName).trim()} request validation.` : `Manager notification from ${company || ''}`;
    const payload = {
      personalizations: [{ to: [{ email: manager_email }] }],
      from: { email: emailFrom },
      subject: safeSubject,
      content: [ { type: 'text/html', value: htmlBody } ]
    };

    let sgRes;
    try {
      console.info('manager-requests: sending_sendgrid_email');
      sgRes = await fetchWithTimeout('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 10000);
      console.info('manager-requests: sendgrid_response', { status: sgRes.status });
    } catch (err) {
      console.error('manager-requests: sendgrid_request_error', err && (err.name || err.message));
      return jsonResponse({ error: 'email_send_failed' }, 502);
    }

    if (sgRes.ok || sgRes.status === 202) {
      console.info(`manager_request_email_sent:to:${manager_email}`);
      return jsonResponse({ ok: true });
    }

    console.warn('sendgrid_response_not_ok', { status: sgRes.status });
    return jsonResponse({ error: 'email_send_failed', status: sgRes.status }, 502);

  } catch (err) {
    console.error('manager_requests_handler_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
}
