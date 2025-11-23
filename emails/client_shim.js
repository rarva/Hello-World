// emails/client_shim.js
// Minimal client shim to call a server-side email endpoint.
// Usage: await window.EmailClient.sendEmail('manager_notification', 'manager@example.com', { userEmail, userName });

(function(){
  async function sendEmail(templateName, to, vars) {
    if (!templateName || !to) throw new Error('templateName and to are required');

    const endpoint = '/api/send-email';
    const body = JSON.stringify({ template: templateName, to, vars });

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Email send failed: ${resp.status} ${err}`);
    }

    return resp.json();
  }

  // Attach to window safely
  try { window.EmailClient = window.EmailClient || {}; window.EmailClient.sendEmail = sendEmail; } catch(e) { /* ignore */ }
})();
