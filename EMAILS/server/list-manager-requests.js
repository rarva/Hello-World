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
    // Prefer the service role key for server-side queries (has full rights).
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || null;

    // Validate token with Supabase Auth endpoint
    const userRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: Object.assign({ Authorization: auth }, supabaseKey ? { apikey: supabaseKey } : {})
    });
    if (!userRes.ok) return jsonResponse({ error: 'invalid_token' }, 401);
    const user = await userRes.json();
    const userEmail = user?.email;
    if (!userEmail) return jsonResponse({ error: 'invalid_user' }, 401);

    // Query Supabase REST for pending manager_requests for this manager
    // Try a foreign-table select to include requester profile fields (preferred),
    // but gracefully fall back to a minimal select if the environment / permissions
    // do not allow foreign selects.
    const baseUrl = supabaseUrl.replace(/\/$/, '');
    const headers = Object.assign({ Accept: 'application/json' }, supabaseKey ? { apikey: supabaseKey } : {}, auth ? { Authorization: auth } : {});

    // Candidate select expressions to try (order matters: richer first)
    const candidateSelects = [
      // Try embedding by related table name (common PostgREST embedding)
      'id,requester_id,manager_email,expires_at,created_at,profiles(id,email,full_name,first_name,last_name)',
      // Try an explicit alias form if the relation is aliased in the schema
      'id,requester_id,manager_email,expires_at,created_at,requester:profiles(id,email,full_name,first_name,last_name)'
    ];

    let items = null;
    let lastError = null;

    for (const sel of candidateSelects) {
      const q = `${baseUrl}/rest/v1/manager_requests?manager_email=eq.${encodeURIComponent(userEmail)}&status=eq.pending&select=${encodeURIComponent(sel)}`;
      try {
        const res = await fetch(q, { method: 'GET', headers });
        if (!res.ok) {
          let bodyText = '<no-body>';
          try { bodyText = await res.text(); } catch (e) { bodyText = `<body-read-failed:${String(e && (e.message||e))}>`; }
          console.warn('manager_requests_list_attempt_failed', { select: sel, status: res.status, body: bodyText });
          lastError = { select: sel, status: res.status, body: bodyText };
          continue; // try next candidate
        }
        const json = await res.json();
        // Normalize embedded profile fields to top-level properties on each item
        items = (json || []).map(it => {
          // Embedded profiles may appear under 'profiles' or 'requester'
          const embedded = it.profiles || it.requester || null;
          if (embedded) {
            if (embedded.email) it.requester_email = embedded.email;
            if (embedded.full_name) it.requester_full_name = embedded.full_name;
            if (embedded.first_name) it.requester_first_name = embedded.first_name;
            if (embedded.last_name) it.requester_last_name = embedded.last_name;
            if (embedded.username) it.requester_username = embedded.username;
          }
          return it;
        });
        break; // success
      } catch (e) {
        console.warn('manager_requests_list_exception', { select: sel, error: String(e && (e.message||e)) });
        lastError = { select: sel, error: String(e && (e.message||e)) };
      }
    }

    // If no embedded attempt returned items, fall back to minimal select (stable)
    if (!items) {
      const fallbackSel = 'id,requester_id,manager_email,expires_at,created_at';
      const q = `${baseUrl}/rest/v1/manager_requests?manager_email=eq.${encodeURIComponent(userEmail)}&status=eq.pending&select=${encodeURIComponent(fallbackSel)}`;
      const res = await fetch(q, { method: 'GET', headers });
      if (!res.ok) {
        let bodyText = '<no-body>';
        try { bodyText = await res.text(); } catch (e) { bodyText = `<body-read-failed:${String(e && (e.message||e))}>`; }
        console.warn('manager_requests_list_failed', { status: res.status, body: bodyText, lastAttempt: lastError });
        return jsonResponse({ error: 'db_query_failed' }, 502);
      }
      items = await res.json();
    }

    // If items exist but don't include requester profile fields, do a secondary
    // query to `/profiles` with an `id=in.(...)` filter to fetch all profiles
    // in one request and merge them into the items. This avoids relying on
    // PostgREST foreign-table embedding which requires explicit FK relations.
    try {
      if (Array.isArray(items) && items.length > 0) {
        const missingProfile = items.some(it => !it.requester_email && it.requester_id);
        if (missingProfile) {
          const ids = Array.from(new Set(items.map(it => it.requester_id).filter(Boolean)));
          if (ids.length > 0) {
            const idsExpr = ids.join(',');
            const profilesQ = `${baseUrl}/rest/v1/profiles?select=id,email,full_name,first_name,last_name&id=in.(${idsExpr})`;
            const profRes = await fetch(profilesQ, { method: 'GET', headers });
            if (profRes.ok) {
              const profiles = await profRes.json().catch(() => []);
              const map = Object.create(null);
              (profiles || []).forEach(p => { if (p && p.id) map[p.id] = p; });
              items = items.map(it => {
                if (it.requester_id && map[it.requester_id]) {
                  const p = map[it.requester_id];
                  if (p.email) it.requester_email = p.email;
                  if (p.full_name) it.requester_full_name = p.full_name;
                  if (p.first_name) it.requester_first_name = p.first_name;
                  if (p.last_name) it.requester_last_name = p.last_name;
                  if (p.username) it.requester_username = p.username;
                }
                return it;
              });
            } else {
              let bodyText = '<no-body>';
              try { bodyText = await profRes.text(); } catch (e) { bodyText = `<body-read-failed:${String(e && (e.message||e))}>`; }
              console.warn('manager_requests_profiles_fetch_failed', { status: profRes.status, body: bodyText });
            }
          }
        }
      }
    } catch (e) {
      console.warn('manager_requests_profiles_merge_error', String(e && (e.message||e)));
    }

    return jsonResponse({ ok: true, items });
  } catch (err) {
    console.error('list_manager_requests_error', err && err.message);
    return jsonResponse({ error: 'internal_error' }, 500);
  }
}
