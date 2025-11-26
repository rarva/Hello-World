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

    // NOTE: per project decision, the send endpoint is now public and does not
    // validate Supabase access tokens here. The respond (accept/decline)
    // endpoint still requires authentication and token verification.
    const supabaseUrl = process.env.SUPABASE_URL || '';

    // Generate a single-use token and its hash
    const rand = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(rand).map(b => ('00' + b.toString(16)).slice(-2)).join('');
    const tokenHash = await sha256Base64Url(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days

    // Attempt to insert into Supabase REST. Note: this requires appropriate DB permissions (service role or RLS allowing inserts).
    try {
      console.info('manager-requests: inserting_manager_request');
      const insertRes = await fetchWithTimeout(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests`, {
        method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, process.env.SUPABASE_ANON_KEY ? { apikey: process.env.SUPABASE_ANON_KEY } : {}),
          body: JSON.stringify({ requester_id: callerId, manager_email, token_hash: tokenHash, expires_at: expiresAt, status: 'pending' })
      }, 10000);
      console.info('manager-requests: manager_requests_insert_response', { status: insertRes.status });
      if (!insertRes.ok) {
        // log minimal info, but continue to attempt sending the email so managers still receive the link
        console.warn('manager-requests: manager_requests_insert_failed', { status: insertRes.status });
      } else {
        console.info('manager-requests: manager_requests_inserted', { status: insertRes.status });
      }
    } catch (e) {
      console.warn('manager-requests: manager_requests_insert_error', e && (e.name || e.message));
    }

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
    const validateLink = `${(baseUrl || '').replace(/\/$/, '')}/requests/validate?token=${token}&email=${encodeURIComponent(manager_email)}`;

    // Render the server-side HTML template for the manager notification.
    // Prefer fetching the project's static template via the public app base URL.
    let renderedHtml = null;
    try {
      const tplUrl = (baseUrl || '').replace(/\/$/, '') + '/EMAILS/templates/manager_notification.html';
      const tplRes = await fetchWithTimeout(tplUrl, { method: 'GET' }, 5000);
      if (tplRes.ok) {
        let tpl = await tplRes.text();
        const escapeHtml = (s) => String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        const replacements = {
          validateLink,
          userName: safeUserName,
          managerName: safeManagerName,
          company: company || '',
          expiresAt
        };
        renderedHtml = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => escapeHtml(replacements[key]));
      }
    } catch (e) {
      console.warn('manager-requests: template_fetch_error', e && (e.message || e.name));
    }

    // If template fetch failed, fall back to previous inline HTML composition.
    // Send the email directly using SendGrid (reuse existing approach)
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    if (!sendgridKey || !emailFrom) return jsonResponse({ error: 'email_service_not_configured' }, 500);

    const safeManagerName = managerName && String(managerName).trim() ? String(managerName).trim() : '';
    const safeUserName = userName && String(userName).trim() ? String(userName).trim() : '';
    const subject = safeUserName ? `${safeUserName} has been added as a report` : 'Manager notification';
    const greeting = safeManagerName ? `Hello ${safeManagerName},` : 'Hello,';

    // Include both an HTML button and a plaintext link fallback to improve
    // compatibility with mail clients like Hotmail/Outlook.
    const payload = {
      personalizations: [{ to: [{ email: manager_email }] }],
      from: { email: emailFrom },
      subject,
      content: [ { type: 'text/html', value: renderedHtml || (`${greeting}<br/><br/>` +
        `<strong>${safeUserName || ''}</strong> has been added as a direct report to ${company || ''}.<br/><br/>` +
        `<a href="${validateLink}" style="display:inline-block;padding:10px 14px;background:#0070f3;color:#fff;border-radius:4px;text-decoration:none">View / Validate</a>` +
        `<div style="margin-top:12px;font-size:12px;color:#666">If the button above does not work, open this link in your browser:<br/><a href="${validateLink}">${validateLink}</a></div>` +
        `<p style="color:#666;font-size:12px">This link expires at ${expiresAt}</p>`)) } ]
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
