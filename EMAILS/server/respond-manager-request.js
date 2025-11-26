export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS) });
}

async function sha256Base64Url(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
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

    const { token, id, action } = body || {};
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) return jsonResponse({ error: 'server_misconfigured' }, 500);
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;

    // If token provided — handle token-based validation (link flow)
    if (token) {
      const tokenHash = await sha256Base64Url(token);
      // Find the pending request matching this token and not expired
      const query = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests?token_hash=eq.${encodeURIComponent(tokenHash)}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id`;
      const qRes = await fetch(query, { method: 'GET', headers: Object.assign({ Accept: 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {}) });
      if (!qRes.ok) return jsonResponse({ error: 'db_query_failed' }, 502);
      const rows = await qRes.json();
      if (!rows || rows.length === 0) return jsonResponse({ error: 'invalid_or_expired_token' }, 400);
      const reqId = rows[0].id;
      const newStatus = (action === 'decline') ? 'declined' : 'accepted';
      // Attempt update
      const upd = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests?id=eq.${encodeURIComponent(reqId)}`, {
        method: 'PATCH',
        headers: Object.assign({ 'Content-Type': 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
        body: JSON.stringify({ status: newStatus })
      });
      if (!upd.ok) return jsonResponse({ error: 'db_update_failed' }, 502);
      return jsonResponse({ ok: true, status: newStatus });
    }

    // Otherwise, require auth and id+action for UI-based response
    if (!id || !action) return jsonResponse({ error: 'missing_parameters' }, 400);
    const auth = req.headers.get('authorization');
    if (!auth) return jsonResponse({ error: 'missing_authorization' }, 401);

    // Validate manager identity
    const userRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: Object.assign({ Authorization: auth }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {})
    });
    if (!userRes.ok) return jsonResponse({ error: 'invalid_token' }, 401);
    const user = await userRes.json();
    const userEmail = user?.email;
    if (!userEmail) return jsonResponse({ error: 'invalid_user' }, 401);

    // Ensure the request belongs to this manager and is pending
    const qRes2 = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests?id=eq.${encodeURIComponent(id)}&manager_email=eq.${encodeURIComponent(userEmail)}&status=eq.pending&select=id`, {
      method: 'GET',
      headers: Object.assign({ Accept: 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {})
    });
    if (!qRes2.ok) return jsonResponse({ error: 'db_query_failed' }, 502);
    const rows2 = await qRes2.json();
    if (!rows2 || rows2.length === 0) return jsonResponse({ error: 'not_found_or_forbidden' }, 404);

    const newStatus2 = (action === 'decline') ? 'declined' : 'accepted';
    const upd2 = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: Object.assign({ 'Content-Type': 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
      body: JSON.stringify({ status: newStatus2 })
    });
    if (!upd2.ok) return jsonResponse({ error: 'db_update_failed' }, 502);
    return jsonResponse({ ok: true, status: newStatus2 });

  } catch (err) {
    console.error('respond_manager_request_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
}
