/* Minimal browser client for the SendGrid manager notification endpoint.
 * Exposes `window.emailClient.sendManagerNotification(opts)`.
 *
 * Usage:
 *   window.emailClient.sendManagerNotification({ recipient_email, subject, html })
 */

// Clean, single implementation with helpful console logging
async function getAccessToken() {
  try {
    if (window.supabase && window.supabase.auth) {
      if (typeof window.supabase.auth.getSession === 'function') {
        const s = await window.supabase.auth.getSession();
        return s?.data?.session?.access_token || null;
      }
      if (typeof window.supabase.auth.session === 'function') {
        return window.supabase.auth.session()?.access_token || null;
      }
    }
  } catch (err) {}
  return null;
}

async function sendManagerNotification(opts = {}) {
  if (!opts || typeof opts !== 'object') throw new Error('invalid_opts');

  const token = opts.token || await getAccessToken();
  if (!token) throw new Error('no_token');

  const payload = Object.assign({}, opts);
  delete payload.token;

  try {
    console.info('emailClient: sending /api/send-manager-notification', { to: payload.recipient_email });
    const res = await fetch('/api/send-manager-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(() => '');
    try { var parsed = JSON.parse(text); } catch(e){ parsed = null; }
    console.info('emailClient: send response', { status: res.status, body: parsed || text.slice(0,200) });

    if (!res.ok) {
      const msg = `email_send_failed:${res.status}` + (text ? ` ${text.slice(0,300)}` : '');
      const err = new Error(msg);
      err.status = res.status;
      err.body = parsed || text;
      throw err;
    }

    return parsed || { ok: true };
  } catch (err) {
    console.warn('emailClient: sendManagerNotification error', err && (err.message || err));
    throw err;
  }
}

if (typeof window !== 'undefined') {
  window.emailClient = window.emailClient || {};
  window.emailClient.sendManagerNotification = sendManagerNotification;
}

/* Export nothing (this file is included as a plain script tag).
 * Keep implementation minimal so it can be loaded in legacy pages.
 */
/* Minimal browser client for the SendGrid manager notification endpoint.
 * Exposes `window.emailClient.sendManagerNotification(opts)`.
 *
 * Usage:
 *   window.emailClient.sendManagerNotification({ recipient_email, subject, html })
 */

async function getAccessToken() {
  try {
    if (window.supabase && window.supabase.auth) {
      // v2: auth.getSession(); v1: auth.session()
      if (typeof window.supabase.auth.getSession === 'function') {
        const s = await window.supabase.auth.getSession();
        return s?.data?.session?.access_token || null;
      }
      if (typeof window.supabase.auth.session === 'function') {
        return window.supabase.auth.session()?.access_token || null;
      }
    }
  } catch (err) {
    // swallow, will handle below
  }
  return null;
}

async function sendManagerNotification(opts = {}) {
  if (!opts || typeof opts !== 'object') throw new Error('invalid_opts');

  const token = opts.token || await getAccessToken();
  if (!token) throw new Error('no_token');

  const payload = Object.assign({}, opts);
  // remove token property if present so it isn't sent to the server
  delete payload.token;

  const res = await fetch('/api/send-manager-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = `email_send_failed:${res.status}` + (text ? ` ${text.slice(0,300)}` : '');
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return res.json().catch(() => ({ ok: true }));
}

// Attach to window for easy use by existing UI code
if (typeof window !== 'undefined') {
  window.emailClient = window.emailClient || {};
  window.emailClient.sendManagerNotification = sendManagerNotification;
}

/* Export nothing (this file is included as a plain script tag).
 * Keep implementation minimal so it can be loaded in legacy pages.
 */
/**
 * Minimal browser client for the SendGrid manager notification endpoint.
 * Exposes `window.emailClient.sendManagerNotification(opts)`.
/* Minimal browser client for the SendGrid manager notification endpoint.
 * Exposes `window.emailClient.sendManagerNotification(opts)`.
 *
 * Usage:
 *   window.emailClient.sendManagerNotification({ recipient_email, subject, html })
 */

async function getAccessToken() {
  try {
    if (window.supabase && window.supabase.auth) {
      // v2: auth.getSession(); v1: auth.session()
      if (typeof window.supabase.auth.getSession === 'function') {
        const s = await window.supabase.auth.getSession();
        return s?.data?.session?.access_token || null;
      }
      if (typeof window.supabase.auth.session === 'function') {
        return window.supabase.auth.session()?.access_token || null;
      }
    }
  } catch (err) {
    // swallow, will handle below
  }
  return null;
}

async function sendManagerNotification(opts = {}) {
  if (!opts || typeof opts !== 'object') throw new Error('invalid_opts');

  const token = opts.token || await getAccessToken();
  if (!token) throw new Error('no_token');

  const payload = Object.assign({}, opts);
  // remove token property if present so it isn't sent to the server
  delete payload.token;

  const res = await fetch('/api/send-manager-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = `email_send_failed:${res.status}` + (text ? ` ${text.slice(0,300)}` : '');
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return res.json().catch(() => ({ ok: true }));
}

// Attach to window for easy use by existing UI code
if (typeof window !== 'undefined') {
  window.emailClient = window.emailClient || {};
  window.emailClient.sendManagerNotification = sendManagerNotification;
}
            const msg = `email_send_failed:${res.status}` + (text ? ` ${text.slice(0,300)}` : '');
