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

    let auth = req.headers.get('authorization');
    // Fallback: some deployments set a _vercel_jwt cookie for preview auth flows.
    // If the Authorization header is missing, try to extract the cookie and use it.
    if (!auth) {
      try {
        const cookieHeader = req.headers.get('cookie') || '';
        const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith('_vercel_jwt='));
        if (m) {
          const token = decodeURIComponent(m.split('=')[1] || '');
          if (token) {
            auth = 'Bearer ' + token;
            console.info('manager-requests: using _vercel_jwt cookie as Authorization fallback');
          }
        }
      } catch (e) { /* ignore */ }
    }
    if (!auth) return jsonResponse({ error: 'missing_authorization' }, 401);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;
    if (!supabaseUrl) return jsonResponse({ error: 'server_misconfigured' }, 500);

    // Validate the caller's token with Supabase Auth endpoint and log progression
    console.info('manager-requests: validating_supabase_token');
    let userRes;
    try {
      userRes = await fetchWithTimeout(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        method: 'GET',
        headers: Object.assign({ Authorization: auth }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {})
      }, 10000);
      console.info('manager-requests: supabase_token_validation_response', { status: userRes.status });
    } catch (err) {
      console.warn('manager-requests: supabase_auth_fetch_error', err && (err.name || err.message));
      return jsonResponse({ error: 'supabase_auth_timeout' }, 504);
    }
    if (!userRes.ok) {
      console.info('manager-requests: supabase_token_validation_failed', { status: userRes.status });
      return jsonResponse({ error: 'invalid_token' }, 401);
    }

    const user = await userRes.json();
    const callerId = user?.id;
    if (!callerId) return jsonResponse({ error: 'invalid_user' }, 401);

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
        headers: Object.assign({ 'Content-Type': 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
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
    const validateLink = `${(baseUrl || '').replace(/\/$/, '')}/requests/validate?token=${token}`;

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
      content: [ { type: 'text/html', value: `${greeting}<br/><br/>` +
        `<strong>${safeUserName || ''}</strong> has been added as a direct report to ${company || ''}.<br/><br/>` +
        `<a href="${validateLink}" style="display:inline-block;padding:10px 14px;background:#0070f3;color:#fff;border-radius:4px;text-decoration:none">View / Validate</a>` +
        `<div style="margin-top:12px;font-size:12px;color:#666">If the button above does not work, open this link in your browser:<br/><a href="${validateLink}">${validateLink}</a></div>` +
        `<p style="color:#666;font-size:12px">This link expires at ${expiresAt}</p>` } ]
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
