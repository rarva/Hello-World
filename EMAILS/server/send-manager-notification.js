export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
  });
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // simple email pattern
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export default async function handler(req) {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, CORS_HEADERS);
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return jsonResponse({ error: 'invalid_json' }, 400, CORS_HEADERS);
    }

    const { recipient_email, subject, html, text, templateName, templateData, actorId } = body || {};

    if (!isValidEmail(recipient_email)) {
      return jsonResponse({ error: 'invalid_recipient_email' }, 400, CORS_HEADERS);
    }

    if (!( (subject && (html || text)) || (templateName && templateData) )) {
      return jsonResponse({ error: 'missing_content' }, 400, CORS_HEADERS);
    }

    let auth = req.headers.get('authorization');
    // Fallback to _vercel_jwt cookie for preview deployments where Authorization header
    // may not be forwarded by the browser or proxy. Keep behavior minimal and explicit.
    if (!auth) {
      try {
        const cookieHeader = req.headers.get('cookie') || '';
        const m = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith('_vercel_jwt='));
        if (m) {
          const token = decodeURIComponent(m.split('=')[1] || '');
          if (token) {
            auth = 'Bearer ' + token;
            console.info('send-manager-notification: using _vercel_jwt cookie as Authorization fallback');
          }
        }
      } catch (e) { /* ignore */ }
    }
    if (!auth) return jsonResponse({ error: 'missing_authorization' }, 401, CORS_HEADERS);

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      return jsonResponse({ error: 'server_misconfigured' }, 500, CORS_HEADERS);
    }

    // Validate token with Supabase Auth endpoint
    // Some Supabase auth endpoints require the project `apikey` header
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;

    // Use a fetch with timeout to avoid platform invocation hangs
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

    console.info('send-manager-notification: validating_supabase_token');
    let userRes;
    try {
      userRes = await fetchWithTimeout(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        method: 'GET',
        headers: Object.assign({ Authorization: auth }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {})
      }, 10000);
      console.info('send-manager-notification: supabase_token_validation_response', { status: userRes.status });
    } catch (err) {
      console.warn('send-manager-notification: supabase_auth_fetch_error', err && (err.name || err.message));
      return jsonResponse({ error: 'supabase_auth_timeout' }, 504, CORS_HEADERS);
    }

    if (!userRes.ok) {
      // Minimal logging on token validation failure (avoid logging response bodies)
      console.info('supabase_token_validation_failed', { status: userRes.status });
      return jsonResponse({ error: 'invalid_token' }, 401, CORS_HEADERS);
    }

    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) {
      // Minimal log for unexpected user payload
      console.info('supabase_invalid_user_payload');
      return jsonResponse({ error: 'invalid_user' }, 401, CORS_HEADERS);
    }

    // Minimal business authorization: if actorId supplied it must match caller, otherwise allow
    if (actorId && actorId !== userId) {
      return jsonResponse({ error: 'forbidden' }, 403, CORS_HEADERS);
    }

    // Compose SendGrid payload
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    if (!sendgridKey || !emailFrom) {
      return jsonResponse({ error: 'email_service_not_configured' }, 500, CORS_HEADERS);
    }

    const payload = {
      personalizations: [{ to: [{ email: recipient_email }] }],
      from: (() => {
        // try to parse a name/email pair if provided, otherwise treat as email string
        return { email: emailFrom };
      })(),
      subject: subject || (templateData && templateData.subject) || 'Notification',
      content: []
    };

    if (html) payload.content.push({ type: 'text/html', value: html });
    if (text) payload.content.push({ type: 'text/plain', value: text });

    if (templateName) {
      // If using SendGrid templates you would set template_id and dynamic_template_data
      // Only set `template_id` when it looks like a real SendGrid template GUID.
      const isGuid = typeof templateName === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateName);
      if (isGuid) {
        payload.template_id = templateName;
        payload.dynamic_template_data = templateData;
      } else {
        // Treat `templateName` as a local alias; do not set `template_id` so SendGrid will use `content`.
        // Keep minimal debug level to avoid noise in production logs.
        try { console.debug && console.debug('template_alias_used_no_guid'); } catch (e) {}
        if (templateData) payload.dynamic_template_data = templateData;
      }
    }

    // Call SendGrid with timeout and logging
    let sgRes;
    try {
      console.info('send-manager-notification: sending_sendgrid_email to', recipient_email);
      sgRes = await fetchWithTimeout('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }, 10000);
      console.info('send-manager-notification: sendgrid_response', { status: sgRes.status });
    } catch (err) {
      console.error('send-manager-notification: sendgrid_request_error', err && (err.name || err.message));
      return jsonResponse({ error: 'email_send_failed' }, 502, CORS_HEADERS);
    }

    if (sgRes.ok || sgRes.status === 202) {
      // Log a concise, non-sensitive event
      console.info(`email_request:userId:${userId}:to:${recipient_email}:status:success`);
      return jsonResponse({ ok: true }, 200, CORS_HEADERS);
    }

    // Keep SendGrid failure logging minimal to avoid exposing response bodies.
    console.warn && console.warn('sendgrid_response_not_ok', { status: sgRes.status });
    return jsonResponse({ error: 'email_send_failed', status: sgRes.status }, 502, CORS_HEADERS);

  } catch (err) {
    console.error('handler_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500, CORS_HEADERS);
  }
}
