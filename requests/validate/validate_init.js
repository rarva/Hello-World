// Minimal client to validate manager request tokens.
(function(){
  const root = document.getElementById('root');
  const title = document.getElementById('title');
  const msg = document.getElementById('message');
  const actions = document.getElementById('actions');

  function setMessage(t, m){ if (title) title.textContent = t; if (msg) msg.textContent = m; }

  async function run() {
    try {
      const qp = new URLSearchParams(window.location.search || '');
      const token = qp.get('token');
      const email = qp.get('email');
      if (!token) {
        setMessage('Missing token', 'No token was provided in the URL.');
        return;
      }
      // Authenticated: proceed to validate token by calling respond endpoint
      setMessage('Validating request…', 'Contacting server to validate this request.');

      const res = await fetch('/api/manager-requests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const text = await res.text().catch(()=>'');
      let data = null; try { data = JSON.parse(text); } catch(e) { data = null; }

      if (!res.ok) {
        const err = (data && (data.error || data.message)) || text || `HTTP ${res.status}`;
        setMessage('Validation failed', String(err));
        actions.innerHTML = '<div style="margin-top:12px"><a class="btn" href="/">Return to app</a></div>';
        return;
      }

      const status = data && data.status ? String(data.status) : 'accepted';
      if (status === 'accepted') {
        setMessage('Request accepted', 'Thank you — this request has been accepted.');
        actions.innerHTML = '<div style="margin-top:12px"><a class="btn" href="/">Open app</a></div>';
        return;
      }
      if (status === 'declined') {
        setMessage('Request declined', 'The request was declined.');
        actions.innerHTML = '<div style="margin-top:12px"><a class="btn" href="/">Open app</a></div>';
        return;
      }

      setMessage('Result', 'Operation completed.');
      actions.innerHTML = '<div style="margin-top:12px"><a class="btn" href="/">Open app</a></div>';

    } catch (err) {
      setMessage('Unexpected error', String(err && err.message || err));
      actions.innerHTML = '<div style="margin-top:12px"><a class="btn" href="/">Return</a></div>';
    }
  }

  // Run once DOM loaded
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
