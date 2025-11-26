(function(){
  const tplPath = 'containers/requests/requests.html';

  async function loadTemplate(){
    const r = await fetch(tplPath);
    if (!r.ok) throw new Error('Failed to load requests template');
    return await r.text();
  }

  (function ensureStyles(){
    if (!document.querySelector('link[data-requests-styles]')){
      const l = document.createElement('link'); l.rel='stylesheet'; l.href='/containers/requests/requests_styles.css'; l.setAttribute('data-requests-styles','1'); document.head.appendChild(l);
    }
  })();

  async function openRequests(){
    if (document.getElementById('requests-container')) return;
    try{
      const html = await loadTemplate();
      const frag = document.createRange().createContextualFragment(html);
      const mount = frag.querySelector('#requests-container') || frag.firstElementChild;
      const main = document.getElementById('main-container') || document.body;
      const footer = document.getElementById('footer-container');
      if (footer && footer.parentNode === main) main.insertBefore(mount, footer);
      else main.appendChild(mount);

      // wire close button
      const close = document.getElementById('requests-close') || mount.querySelector('#requests-close');
      if (close && !close.dataset._bound){ close.addEventListener('click', (e)=>{ e.preventDefault(); closeRequests(); }); close.dataset._bound='1'; }

      // load pending requests from server
      const list = document.getElementById('requests-list') || mount.querySelector('#requests-list');
      if (list) list.textContent = 'Loading requests...';

      try {
        const token = (window.currentUser && (window.currentUser.access_token || window.currentUser.user?.access_token)) || null;
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch('/api/manager-requests/list', { method: 'GET', headers });
        if (!res.ok) throw new Error('list_failed');
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.items) || data.items.length === 0) {
          list.textContent = 'No requests to show.';
          return;
        }

        // render items
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
              const token2 = (window.currentUser && (window.currentUser.access_token || window.currentUser.user?.access_token)) || null;
              const headers2 = { 'Content-Type': 'application/json' };
              if (token2) headers2['Authorization'] = 'Bearer ' + token2;
              const r = await fetch('/api/manager-requests/respond', { method: 'POST', headers: headers2, body: JSON.stringify({ id: it.id, action: 'accept' }) });
              if (!r.ok) throw new Error('respond_failed');
              const j = await r.json();
              if (j.ok) el.querySelector('.request-actions').innerHTML = '<em>Accepted</em>';
            } catch (e) { console.warn('accept failed', e); accept.disabled = false; decline.disabled = false; }
          });
          decline.addEventListener('click', async (ev)=>{
            ev.preventDefault(); accept.disabled = true; decline.disabled = true;
            try {
              const token2 = (window.currentUser && (window.currentUser.access_token || window.currentUser.user?.access_token)) || null;
              const headers2 = { 'Content-Type': 'application/json' };
              if (token2) headers2['Authorization'] = 'Bearer ' + token2;
              const r = await fetch('/api/manager-requests/respond', { method: 'POST', headers: headers2, body: JSON.stringify({ id: it.id, action: 'decline' }) });
              if (!r.ok) throw new Error('respond_failed');
              const j = await r.json();
              if (j.ok) el.querySelector('.request-actions').innerHTML = '<em>Declined</em>';
            } catch (e) { console.warn('decline failed', e); accept.disabled = false; decline.disabled = false; }
          });
          actions.appendChild(accept); actions.appendChild(decline);
          el.appendChild(actions);
          list.appendChild(el);
        });
      } catch (e) {
        list.textContent = 'Failed to load requests.';
        console.warn('Failed to fetch requests', e);
      }

    } catch (e){ console.error('openRequests failed', e); }
  }

  function closeRequests(){
    const node = document.getElementById('requests-container'); if (node) node.remove();
  }

  window.openRequests = openRequests;
  window.closeRequests = closeRequests;
})();
