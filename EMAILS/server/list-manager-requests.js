export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS) });
}

export default async function handler(req) {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (req.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);

    const auth = req.headers.get('authorization');
    if (!auth) return jsonResponse({ error: 'missing_authorization' }, 401);

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) return jsonResponse({ error: 'server_misconfigured' }, 500);
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;

    // Validate token with Supabase Auth endpoint
    const userRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: Object.assign({ Authorization: auth }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {})
    });
    if (!userRes.ok) return jsonResponse({ error: 'invalid_token' }, 401);
    const user = await userRes.json();
    const userEmail = user?.email;
    if (!userEmail) return jsonResponse({ error: 'invalid_user' }, 401);

    // Query Supabase REST for pending manager_requests for this manager
    const listRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/manager_requests?manager_email=eq.${encodeURIComponent(userEmail)}&status=eq.pending&select=id,requester_id,manager_email,expires_at,created_at`, {
      method: 'GET',
      headers: Object.assign({ Accept: 'application/json' }, supabaseAnonKey ? { apikey: supabaseAnonKey } : {})
    });

    if (!listRes.ok) {
      console.warn('manager_requests_list_failed', { status: listRes.status });
      return jsonResponse({ error: 'db_query_failed' }, 502);
    }

    const items = await listRes.json();
    return jsonResponse({ ok: true, items });
  } catch (err) {
    console.error('list_manager_requests_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
}
