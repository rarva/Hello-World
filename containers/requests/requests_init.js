(function(){
  const tplPath = 'containers/requests/requests.html';

  async function loadTemplate(){
    const r = await fetch(tplPath);
    if (!r.ok) throw new Error('Failed to load requests template');
    return await r.text();
  }

  (function ensureStyles(){
    if (!document.querySelector('link[data-requests-styles]')){
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/containers/requests/requests_styles.css';
      l.setAttribute('data-requests-styles','1');
      document.head.appendChild(l);
    }
  })();

  async function openRequests(){
    // If already mounted, do nothing
    if (document.getElementById('requests-container')) return;
    try {
      console.info('openRequests: started');

      // Resolve access token (prefer window.currentUser, fallback to supabase session)
      let token = null;
      try { token = (window.currentUser && (window.currentUser.access_token || window.currentUser.user?.access_token)) || null; } catch (e) { token = null; }
      console.debug('openRequests: tokenFromWindowCurrentUser', !!token);
      if (!token && window.supabase && typeof window.supabase.auth?.getSession === 'function') {
        try { const { data: { session } } = await window.supabase.auth.getSession(); token = session?.access_token || null; } catch (e) { /* ignore */ }
        console.debug('openRequests: tokenFromSupabaseGetSession', !!token);
      }

      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      // Fetch list first; only mount UI when there are items
      let res;
      try {
        console.debug('openRequests: fetching /api/manager-requests/list', { hasAuth: !!headers.Authorization });
        res = await fetch('/api/manager-requests/list', { method: 'GET', headers });
      } catch (e) {
        console.warn('openRequests: list fetch failed', e);
        return;
      }

      if (!res.ok) {
        console.warn('openRequests: list fetch returned non-ok', res.status);
        try { const txt = await res.text().catch(() => ''); console.debug('openRequests: body', txt.slice ? txt.slice(0,300) : txt); } catch (e) {}
        return;
      }

      const data = await res.json().catch(() => null);
      console.debug('openRequests: list data items', Array.isArray(data?.items) ? data.items.length : 'no-data');
      if (!data || !Array.isArray(data.items) || data.items.length === 0) return;

      // Mount template and render items
      const html = await loadTemplate();
      const frag = document.createRange().createContextualFragment(html);
      const mount = frag.querySelector('#requests-container') || frag.firstElementChild;
      const main = document.getElementById('main-container') || document.body;
      const footer = document.getElementById('footer-container');
      if (footer && footer.parentNode === main) main.insertBefore(mount, footer);
      else main.appendChild(mount);

      const close = document.getElementById('requests-close') || mount.querySelector('#requests-close');
      if (close && !close.dataset._bound) { close.addEventListener('click', (e)=>{ e.preventDefault(); closeRequests(); }); close.dataset._bound = '1'; }

      const list = document.getElementById('requests-list') || mount.querySelector('#requests-list');
      if (!list) return;
      list.innerHTML = '';
      data.items.forEach(it => {
        const el = document.createElement('div'); el.className = 'request-item';
        const created = new Date(it.created_at).toLocaleString();
        const expires = it.expires_at ? new Date(it.expires_at).toLocaleString() : '';
        el.innerHTML = `<div><strong>Request</strong> — created: ${created} — expires: ${expires}</div>`;
        const actions = document.createElement('div'); actions.className = 'request-actions';
        const accept = document.createElement('button'); accept.textContent = 'Accept';
        const decline = document.createElement('button'); decline.textContent = 'Decline';

        accept.addEventListener('click', async (ev)=>{
          ev.preventDefault(); accept.disabled = true; decline.disabled = true;
          try {
            let token2 = null;
            try { token2 = (window.currentUser && (window.currentUser.access_token || window.currentUser.user?.access_token)) || null; } catch (e) { token2 = null; }
            if (!token2 && window.supabase && typeof window.supabase.auth?.getSession === 'function') {
              try { const { data: { session } } = await window.supabase.auth.getSession(); token2 = session?.access_token || null; } catch (e) { /* ignore */ }
            }
            const headers2 = { 'Content-Type': 'application/json' };
            if (token2) headers2['Authorization'] = 'Bearer ' + token2;
            const r = await fetch('/api/manager-requests/respond', { method: 'POST', headers: headers2, body: JSON.stringify({ id: it.id, action: 'accept' }) });
            if (!r.ok) throw new Error('respond_failed');
            const j = await r.json(); if (j.ok) el.querySelector('.request-actions').innerHTML = '<em>Accepted</em>';
          } catch (e) { console.warn('accept failed', e); accept.disabled = false; decline.disabled = false; }
        });

        decline.addEventListener('click', async (ev)=>{
          ev.preventDefault(); accept.disabled = true; decline.disabled = true;
          try {
            let token2 = null;
            try { token2 = (window.currentUser && (window.currentUser.access_token || window.currentUser.user?.access_token)) || null; } catch (e) { token2 = null; }
            if (!token2 && window.supabase && typeof window.supabase.auth?.getSession === 'function') {
              try { const { data: { session } } = await window.supabase.auth.getSession(); token2 = session?.access_token || null; } catch (e) { /* ignore */ }
            }
            const headers2 = { 'Content-Type': 'application/json' };
            if (token2) headers2['Authorization'] = 'Bearer ' + token2;
            const r = await fetch('/api/manager-requests/respond', { method: 'POST', headers: headers2, body: JSON.stringify({ id: it.id, action: 'decline' }) });
            if (!r.ok) throw new Error('respond_failed');
            const j = await r.json(); if (j.ok) el.querySelector('.request-actions').innerHTML = '<em>Declined</em>';
          } catch (e) { console.warn('decline failed', e); accept.disabled = false; decline.disabled = false; }
        });

        actions.appendChild(accept); actions.appendChild(decline);
        el.appendChild(actions);
        list.appendChild(el);
      });

    } catch (e) {
      console.error('openRequests failed', e);
    }
  }

  function closeRequests(){
    const node = document.getElementById('requests-container'); if (node) node.remove();
  }

  window.openRequests = openRequests;
  window.closeRequests = closeRequests;
})();
