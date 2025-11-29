/* Minimal browser client for the SendGrid manager notification endpoint.
 * Exposes `window.emailClient.sendManagerNotification(opts)`.
 *
 * Usage:
 *   window.emailClient.sendManagerNotification({ recipient_email, subject, html })
 */

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
  } catch (err) {
    // swallow and return null
  }
  return null;
}

async function sendManagerNotification(opts = {}) {
  if (!opts || typeof opts !== 'object') throw new Error('invalid_opts');

  const token = opts.token || await getAccessToken();
  if (!token) throw new Error('no_token');

  const payload = Object.assign({}, opts);
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
    err.body = text;
    throw err;
  }

  return res.json().catch(() => ({ ok: true }));
}

if (typeof window !== 'undefined') {
  window.emailClient = window.emailClient || {};
  window.emailClient.sendManagerNotification = sendManagerNotification;
}
