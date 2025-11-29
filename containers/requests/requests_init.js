(function () {
  const tplPath = 'containers/requests/requests.html';

  async function loadTemplate() {
    const r = await fetch(tplPath);
    if (!r.ok) throw new Error((window.getString && typeof window.getString === 'function') ? window.getString('requests.load_failed_template') : 'Failed to load requests template');
    return await r.text();
  }

  (function ensureStyles() {
    if (!document.querySelector('link[data-requests-styles]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/containers/requests/requests_styles.css';
      l.setAttribute('data-requests-styles', '1');
      document.head.appendChild(l);
    }
  })();

  async function resolveAuthToken() {
    let token = null;
    try {
      if (window.currentUser) token = window.currentUser.access_token || window.currentUser.user?.access_token || null;
    } catch (e) { /* ignore */ }
    if (!token && window.supabase && typeof window.supabase.auth?.getSession === 'function') {
      try {
        const { data: { session } } = await window.supabase.auth.getSession();
        token = session?.access_token || null;
      } catch (e) { /* ignore */ }
    }
    try { console.debug('[requests:trace] resolveAuthToken ->', { tokenAvailable: !!token }); } catch (e) {}
    return token;
  }

  async function openRequests() {
    console.info('openRequests: started');

    const existing = document.getElementById('requests-container');
    if (existing) {
      try {
        existing.classList.add('visible');
        if (existing.style && existing.style.display === 'none') existing.style.removeProperty('display');
        try { console.info('[requests:flag] re-show existing mount', getComputedStyle(existing).display); } catch (e) {}
      } catch (e) { console.warn('[requests:flag] failed to re-show existing mount', e); }
    }

    const token = await resolveAuthToken();
    console.debug('openRequests: tokenResolved', !!token);

    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let data = { items: [] };
    try {
      console.debug('openRequests: fetching /api/manager-requests/list', { hasAuth: !!headers.Authorization });
      let res = await fetch('/api/manager-requests/list', { method: 'GET', headers });

      // If server responded 401 and we didn't have a token, try to re-resolve the token
      if (res.status === 401 && !token) {
        console.info('openRequests: received 401 and no token present — retrying token resolution');
        const newToken = await resolveAuthToken();
        if (newToken) {
          console.info('openRequests: resolved token on retry');
          headers['Authorization'] = 'Bearer ' + newToken;
          res = await fetch('/api/manager-requests/list', { method: 'GET', headers });
        } else {
          console.info('openRequests: token still not available after retry');
        }
      }

      if (!res.ok) {
        console.warn('openRequests: list fetch returned non-ok', res.status);
        const txt = await res.text().catch(() => '');
        console.debug('openRequests: body', txt && txt.slice ? txt.slice(0, 300) : txt);
        data._fetchError = true;
      } else {
        const parsed = await res.json().catch(() => null);
        if (parsed && Array.isArray(parsed.items)) data.items = parsed.items;
        else data._noData = true;
      }
    } catch (e) {
      console.warn('openRequests: list fetch failed', e);
      data._fetchError = true;
    }

    console.debug('openRequests: list data items', Array.isArray(data.items) ? data.items.length : 'no-data', data);

    // Mount UI
    let mount = document.getElementById('requests-container');
    if (!mount) {
      const html = await loadTemplate();
      const frag = document.createRange().createContextualFragment(html);
      mount = frag.querySelector('#requests-container') || frag.firstElementChild;
      const main = document.getElementById('main-container') || document.body;
      const footer = document.getElementById('footer-container');
      try {
        if (footer && footer.parentNode === main) main.insertBefore(mount, footer);
        else main.appendChild(mount);
      } catch (e) {
        document.body.appendChild(mount);
      }
    }

    // Close button
    const close = document.getElementById('requests-close') || mount.querySelector('#requests-close');
    if (close && !close.dataset._bound) {
      close.addEventListener('click', (e) => { e.preventDefault(); closeRequests(); });
      close.dataset._bound = '1';
    }

    const list = document.getElementById('requests-list') || mount.querySelector('#requests-list');
    if (!list) return;
    list.innerHTML = '';

    if (!data.items || data.items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'requests-empty';
      const txtKey = data._fetchError ? 'requests.empty_error' : 'requests.empty_no_requests';
      empty.textContent = (window.getString && typeof window.getString === 'function') ? window.getString(txtKey) : (data._fetchError ? 'Failed to load requests.' : 'No requests.');
      list.appendChild(empty);
    } else {
      data.items.forEach((it) => {
        const el = document.createElement('div');
        el.className = 'request-item';

        const message = document.createElement('div');
        message.className = 'request-message';
        // Try to read requester info returned from the server (via joined profiles)
        const requester = (it.requester && Array.isArray(it.requester) && it.requester[0]) ? it.requester[0] : null;
        let email = requester?.email || it.user_email || it.email || it.email_address || '';
        let name = requester?.full_name || requester?.username || (requester?.first_name && requester?.last_name ? `${requester.first_name} ${requester.last_name}` : '') || (it.user_name || it.username || it.name || '');

        // Initial message (may be updated after a fallback fetch)
        const renderMessage = () => {
          const displayEmail = email || '';
          const displayName = name || '';
          if (window.getString && typeof window.getString === 'function') {
            const tpl = window.getString('requests.message');
            if (tpl && tpl.indexOf('{email}') !== -1) {
              message.textContent = tpl.replace('{email}', displayEmail).replace('{name}', displayName);
              return;
            }
            // fallback when message template not present
            message.textContent = (displayEmail || displayName) ? `${displayEmail} ${displayName}` : (window.getString('requests.message_no_info') || 'Request details unavailable.');
            return;
          }
          message.textContent = `From: ${displayEmail} - ${displayName} declared to reports to you.`;
        };
        renderMessage();

        // If we don't have email or name but we have a requester_id, try fetching the profile client-side
        if ((!email || !name) && it.requester_id && window.supabase && typeof window.supabase.from === 'function') {
          (async () => {
            try {
              const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('email,full_name,first_name,last_name')
                .eq('id', it.requester_id)
                .single();
              if (!error && profile) {
                email = email || profile.email || '';
                name = name || profile.full_name || profile.username || ((profile.first_name && profile.last_name) ? `${profile.first_name} ${profile.last_name}` : '');
                renderMessage();
              }
            } catch (e) {
              console.warn('requests: profile fetch failed', e);
            }
          })();
        }

        const actions = document.createElement('div');
        actions.className = 'request-actions';

        const confirm = document.createElement('button');
        confirm.className = 'btn btn-primary btn-confirm';
        confirm.textContent = (window.getString && typeof window.getString === 'function') ? window.getString('requests.confirm') : 'Confirm';
        try { confirm.setAttribute('aria-label', ((window.getString && typeof window.getString === 'function') ? window.getString('requests.confirm_aria').replace('{who}', (name || email || '').trim()) : `Confirm request from ${name || email}`)); } catch (e) { /* ignore */ }

        const refuse = document.createElement('button');
        refuse.className = 'btn btn-primary btn-refuse';
        refuse.textContent = (window.getString && typeof window.getString === 'function') ? window.getString('requests.refuse') : 'Refuse';
        try { refuse.setAttribute('aria-label', ((window.getString && typeof window.getString === 'function') ? window.getString('requests.refuse_aria').replace('{who}', (name || email || '').trim()) : `Refuse request from ${name || email}`)); } catch (e) { /* ignore */ }

        async function doRespond(action) {
          confirm.disabled = true; refuse.disabled = true;
          try {
            const token2 = await resolveAuthToken();
            const headers2 = { 'Content-Type': 'application/json' };
            if (token2) headers2['Authorization'] = 'Bearer ' + token2;
            const r = await fetch('/api/manager-requests/respond', { method: 'POST', headers: headers2, body: JSON.stringify({ id: it.id, action }) });
            if (!r.ok) throw new Error('respond_failed');
            const j = await r.json().catch(() => ({}));
            if (j && j.ok) {
              const key = action === 'accept' ? 'requests.confirmed' : 'requests.refused';
              actions.innerHTML = `<em>${(window.getString && typeof window.getString === 'function') ? window.getString(key) : (action === 'accept' ? 'Confirmed' : 'Refused')}</em>`;
            } else {
              throw new Error('response_not_ok');
            }
          } catch (e) {
            console.warn(action + ' failed', e);
            confirm.disabled = false; refuse.disabled = false;
          }
        }

        confirm.addEventListener('click', (ev) => { ev.preventDefault(); doRespond('accept'); });
        refuse.addEventListener('click', (ev) => { ev.preventDefault(); doRespond('decline'); });

        actions.appendChild(confirm);
        actions.appendChild(refuse);

        el.appendChild(message);
        el.appendChild(actions);
        list.appendChild(el);
      });
    }
  }

  function closeRequests() {
    const node = document.getElementById('requests-container');
    if (node) node.remove();
  }

  window.openRequests = openRequests;
  window.closeRequests = closeRequests;
})();
