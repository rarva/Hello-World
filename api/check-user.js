export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS) });
}

async function fetchWithTimeout(resource, options = {}, timeout = 8000) {
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

export default async function handler(req) {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (req.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);

    const url = new URL(req.url);
    const email = (url.searchParams.get('email') || '').trim();
    if (!email) return jsonResponse({ error: 'missing_email' }, 400);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || null;
    if (!supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: 'server_misconfigured' }, 500);

    const q = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`;
    let res;
    try {
      res = await fetchWithTimeout(q, { method: 'GET', headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } }, 8000);
    } catch (err) {
      console.warn('check-user: fetch_error', err && (err.name || err.message));
      return jsonResponse({ error: 'upstream_error' }, 502);
    }

    if (!res.ok) return jsonResponse({ exists: false });
    const data = await res.json().catch(() => []);
    const exists = Array.isArray(data) && data.length > 0;
    return jsonResponse({ exists });

  } catch (err) {
    console.error('check-user_handler_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
}
