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

    const auth = req.headers.get('authorization');
    if (!auth) return jsonResponse({ error: 'missing_authorization' }, 401, CORS_HEADERS);

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      return jsonResponse({ error: 'server_misconfigured' }, 500, CORS_HEADERS);
    }

    // Validate token with Supabase Auth endpoint
    const userRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: { Authorization: auth }
    });

    if (!userRes.ok) {
      return jsonResponse({ error: 'invalid_token' }, 401, CORS_HEADERS);
    }

    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) return jsonResponse({ error: 'invalid_user' }, 401, CORS_HEADERS);

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
      payload.template_id = templateName;
      payload.dynamic_template_data = templateData;
    }

    // Call SendGrid
    let sgRes;
    try {
      sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('sendgrid_request_error', err);
      return jsonResponse({ error: 'email_send_failed' }, 502, CORS_HEADERS);
    }

    if (sgRes.ok || sgRes.status === 202) {
      // Log a non-sensitive event
      console.log(`email_request:userId:${userId}:to:${recipient_email}:status:success`);
      return jsonResponse({ ok: true }, 200, CORS_HEADERS);
    }

    // Try to read SendGrid error body, but avoid leaking secrets
    let sgBody = null;
    try { sgBody = await sgRes.text(); } catch (e) { sgBody = null; }
    console.warn('sendgrid_response_not_ok', sgRes.status, sgBody ? sgBody.slice(0, 300) : '');
    return jsonResponse({ error: 'email_send_failed', status: sgRes.status }, 502, CORS_HEADERS);

  } catch (err) {
    console.error('handler_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500, CORS_HEADERS);
  }
}
