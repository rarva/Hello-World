/* User Profile initializer
   - Loads styles and template
   - Populates form from Supabase if available or localStorage fallback
   - Tracks changes and disables Save when no changes
   - Listens for avatar preview updates to mark form dirty
   - Handles Save / Cancel with a safe fallback
*/
(function(){
  try { console.log('DEBUG: USER_PROFILE init loaded'); } catch(e){}
  const containerSelector = '#home-container';
  const tplPath = 'containers/user_profile/user_profile.html';
  const stylesPath = 'containers/user_profile/user_profile_styles.css';
  const formSelector = '#user-profile-form';

  let originalSnapshot = null;
  let isSaving = false;

  function loadStyles(){
    if (!document.querySelector('link[data-user-profile]')){
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = stylesPath;
      l.setAttribute('data-user-profile','');
      document.head.appendChild(l);
    }
  }

  async function loadTemplate(){
    try { console.log('DEBUG: USER_PROFILE fetching template', tplPath); } catch (e) {}
    const resp = await fetch(tplPath);
    if (!resp.ok) {
      try { console.error('DEBUG: USER_PROFILE template fetch failed', resp.status, resp.statusText); } catch(e){}
      throw new Error('Failed to load template');
    }
    const html = await resp.text();
    try { console.log('DEBUG: USER_PROFILE template fetched, length=', html.length); } catch(e){}
    return html;
  }

  function normalizeProfileForCompare(profile){
    const clone = Object.assign({}, profile);
    // Remove non-deterministic or empty values
    if (clone.updated_at) delete clone.updated_at;
    return JSON.stringify(clone);
  }

  function getFormState(form){
    const state = {};
    const elements = form.querySelectorAll('input, textarea, select');
    elements.forEach(el=>{
      if (el.type === 'checkbox') state[el.name] = el.checked;
      else state[el.name] = el.value;
    });
    // include displayed static email if present
    const emailStatic = form.querySelector('.profile-email');
    if (emailStatic) state.email = emailStatic.textContent.trim();
    return state;
  }

  function isDirty(form){
    const current = getFormState(form);
    return normalizeProfileForCompare(current) !== originalSnapshot;
  }

  function updateSaveButtonState(form){
    const btn = form.querySelector('.btn-save');
    if (!btn) return;
    if (isSaving) { btn.classList.add('disabled'); btn.disabled = true; return; }
    if (isDirty(form)) { btn.classList.remove('disabled'); btn.disabled = false; }
    else { btn.classList.add('disabled'); btn.disabled = true; }
  }

  function attachChangeHandlers(form){
    form.addEventListener('input', ()=> updateSaveButtonState(form));
    form.addEventListener('change', ()=> updateSaveButtonState(form));
    // Avatar preview changes - other module dispatches 'avatarPreviewChanged'
    window.addEventListener('avatarPreviewChanged', ()=> updateSaveButtonState(form));
  }

  async function populateFormFromProfile(form, profile){
    // Fill known fields if present
    ['first_name','last_name','reports_to_email','start_date','end_date'].forEach(k=>{
      const el = form.querySelector(`[name="${k}"]`);
      if (el && profile[k] !== undefined) el.value = profile[k] || '';
    });
    // show static email (readonly)
    const emailStatic = form.querySelector('.profile-email');
    if (emailStatic) emailStatic.textContent = profile.email || '';
  }

  async function fetchProfile(){
    // If Supabase client exists and user available, fetch; otherwise fallback to localStorage
    try{
      if (window.supabase && window.supabase.auth){
        const user = (await window.supabase.auth.getUser()).data?.user;
        if (user){
          const { data, error } = await window.supabase.from('profiles').select('*').eq('id', user.id).single();
          if (!error && data) return data;
        }
      }
    }catch(e){
      console.warn('Supabase profile read failed', e);
    }
    // local fallback
    const raw = localStorage.getItem('demo_profile') || '{}';
    return JSON.parse(raw);
  }

  async function saveProfile(form){
    try { console.log('DEBUG: USER_PROFILE saveProfile invoked'); } catch(e){}
    if (isSaving) return;
    isSaving = true; updateSaveButtonState(form);
    const state = getFormState(form);
    try{
      // Attempt Supabase update if present
      if (window.supabase && window.supabase.auth){
        const user = (await window.supabase.auth.getUser()).data?.user;
        if (user){
          const { data, error } = await window.supabase.from('profiles').upsert(Object.assign({id:user.id}, state));
          if (error) throw error;
        }
      } else {
        // localStorage fallback
        localStorage.setItem('demo_profile', JSON.stringify(state));
      }

      // on success, refresh snapshot and close
      originalSnapshot = normalizeProfileForCompare(state);
      updateSaveButtonState(form);
      // dispatch an event for other modules
      window.dispatchEvent(new CustomEvent('profileSaved', { detail: state }));
      try { console.log('DEBUG: USER_PROFILE profileSaved dispatched', state); } catch(e){}
      try { console.log('DEBUG: USER_PROFILE updating AvatarStore if present'); } catch(e){}
      // close profile UI
      closeUserProfile();
    }catch(err){
      console.error('Failed to save profile', err);
      try { console.error('DEBUG: USER_PROFILE save failed', err && err.message); } catch(e){}
      alert('Failed to save profile. See console for details.');
    }finally{
      isSaving = false; updateSaveButtonState(form);
    }
  }

  function openUserProfile(){
    try { console.log('DEBUG: USER_PROFILE openUserProfile called'); } catch(e){}
    const container = document.querySelector(containerSelector);
    if (!container) return;
    // if already present, show
    let node = container.querySelector('.user-profile');
    if (node) { node.style.display = 'block'; return; }
 
    loadTemplate().then(html=>{
   
      try { console.log('DEBUG: USER_PROFILE template injected into DOM'); } catch(e){}
  
      if (!form) { try { console.warn('DEBUG: USER_PROFILE form not found in template'); } catch(e){}; return; }
      attachChangeHandlers(form);
      form.querySelector('.btn-cancel')?.addEventListener('click', (e)=>{ e.preventDefault(); closeUserProfile(); });
      form.querySelector('.btn-save')?.addEventListener('click', (e)=>{ e.preventDefault(); saveProfile(form); });
      // populate
      fetchProfile().then(profile=>{
        populateFormFromProfile(form, profile || {});
        originalSnapshot = normalizeProfileForCompare(getFormState(form));
        updateSaveButtonState(form);
      });
    })

  function closeUserProfile(){
    try { console.log('DEBUG: USER_PROFILE closeUserProfile called'); } catch(e){}
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const node = container.querySelector('.user-profile');
    if (node) node.remove();
  }

  // Expose on window for other modules to open/close
  window.UserProfile = window.UserProfile || {};
  window.openUserProfile = openUserProfile;
  window.closeUserProfile = closeUserProfile;

    // Auto-initialize if a placeholder exists on load (but don't force show)
  document.addEventListener('DOMContentLoaded', ()=>{
    loadStyles();
  });

})();
