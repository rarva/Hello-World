// ===============================
// Login Authentication Module
// ===============================
// Handles all authentication logic for signup and login flows

/**
 * Validate email and password inputs
 */
function validateCredentials(email, password, passwordConfirm = null) {
  if (!email || !password) {
    if (!email) window.showFieldError?.('email', getString('login.email_required'));
    if (!password) window.showFieldError?.('password', getString('login.password_required'));
    return false;
  }

  if (!isValidEmail(email)) {
    window.showFieldError?.('email', getString('login.invalid_email'));
    return false;
  }

  if (passwordConfirm !== null && password !== passwordConfirm) {
    window.showFieldError?.('confirm', getString('login.passwords_dont_match'));
    return false;
  }

  return true;
}

/**
 * Handle signup with Supabase
 */
async function handleSupabaseSignup(email, password) {
  console.log('Attempting signup for:', email);
  const { data: signUpData, error: signUpError } = await window.supabase.auth.signUp({ email, password });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    window.showGeneralMessage?.(signUpError.message);
    return null;
  }

  // Create profile row with language preference
  const currentLang = typeof getLanguage === 'function' ? getLanguage() : 'pt';
  const { data: profileData, error: profileError } = await window.supabase
    .from('profiles')
    .insert([{ 
      id: signUpData.user.id,
      email, 
      full_name: '', 
      language: currentLang 
    }])
    .select()
    .single();

  if (profileError) {
    console.error('Profile error:', profileError);
    const message = profileError.message?.includes('unique constraint')
      ? getString('login.email_already_registered')
      : profileError.message || getString('login.signup_error');
    window.showGeneralMessage?.(message);
    return null;
  }

  return signUpData.user;
}

/**
 * Handle signup with localStorage fallback
 */
function handleLocalStorageSignup(email, password) {
  if (app.users?.[email]) {
    window.showFieldError?.('email', getString('login.email_already_registered'));
    return false;
  }

  app.users = app.users || {};
  app.users[email] = `${email}:${password}`;
  localStorage.setItem('users', JSON.stringify(app.users));
  return true;
}

/**
 * Handle login with Supabase
 */
async function handleSupabaseLogin(email, password, rememberMe) {
  console.log('Attempting login for:', email);

  // Check if email exists
  const { data: profileExists, error: profileCheckError } = await window.supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (!profileExists) {
    console.log('Email not found in database');
    window.showGeneralMessage?.(getString('login.email_not_found'));
    return null;
  }

  // Authenticate with password
  const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    console.error('Login error:', authError);
    const message = authError.message?.includes('Email not confirmed')
      ? getString('login.email_not_confirmed')
      : getString('login.wrong_password');
    window.showGeneralMessage?.(message);
    return null;
  }

  // Handle remember me
  if (rememberMe) {
    localStorage.setItem('rememberedEmail', email);
  } else {
    localStorage.removeItem('rememberedEmail');
  }

  // Fetch profile data (language + onboarding status)
  const { data: profileData } = await window.supabase
    .from('profiles')
    .select('language, first_name, last_name, reports_to_email')
    .eq('email', email)
    .single();

  if (profileData?.language && typeof updateLanguageFromProfile === 'function') {
    updateLanguageFromProfile(profileData.language);
  }

  return { user: authData.user, profileData };
}

/**
 * Show post-auth success and navigate
 */
function handleAuthSuccess(user, profileData = null) {
  window.currentUser = user;

  const needsOnboarding = !profileData?.first_name || !profileData?.last_name || !profileData?.reports_to_email;
  window.userNeedsOnboarding = needsOnboarding;

  // Use main.js UI handler if available, else fallback
  if (typeof setUiForAuthState === 'function') {
    setUiForAuthState(true);
  } else {
    if (needsOnboarding && typeof initializeOnboarding === 'function') {
      initializeOnboarding();
    } else if (typeof loadView === 'function') {
      loadView('home');
    }
  }

  // If a post-login return location was set (e.g. from an email validate
  // link), navigate there now so validate flow can complete.
  try {
    const returnTo = sessionStorage.getItem('postLoginReturnTo');
    if (returnTo) {
      sessionStorage.removeItem('postLoginReturnTo');
      // If it's a relative path, navigate within the app. Use replace to
      // avoid leaving a stale state in history.
      try { window.location.replace(returnTo); return; } catch (e) { window.location.href = returnTo; return; }
    }
  } catch (e) { /* ignore */ }

  // Prefetch avatar into memory (convert to data URL) to avoid extra network fetches
  (async () => {
    try {
      // prefer avatar from provided profileData
      let avatarUrl = profileData?.avatar_url || null;

      // If not present, try to fetch it from profiles table
      if (!avatarUrl && window.supabase && user?.id) {
        try {
          const { data: profileRow, error } = await window.supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
          if (!error && profileRow?.avatar_url) avatarUrl = profileRow.avatar_url;
        } catch (e) {
          console.warn('Failed to query profile.avatar_url during auth success', e);
        }
      }

      if (avatarUrl) {
        // Fetch image as blob with a short timeout, then convert to data URL
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const resp = await fetch(avatarUrl, { signal: controller.signal, credentials: 'omit' });
          clearTimeout(timeoutId);
          if (resp && resp.ok) {
            const blob = await resp.blob();
            const dataUrl = await new Promise((resolve, reject) => {
              try {
                const fr = new FileReader();
                fr.onload = () => resolve(fr.result);
                fr.onerror = () => reject(new Error('Failed to convert blob to data URL'));
                fr.readAsDataURL(blob);
              } catch (e) { reject(e); }
            });

            if (dataUrl) {
              try { console.log('Auth avatar prefetch: setting AvatarStore for user', user?.id, 'avatarUrl:', avatarUrl); } catch(e) {}
              try {
                try { console.log('AvatarStore.setImage called with prefetched data URL'); } catch(e) {}
                if (window.AvatarStore && typeof window.AvatarStore.setImage === 'function') {
                  window.AvatarStore.setImage(dataUrl);
                } else {
                  // Create a minimal AvatarStore if missing
                  window.AvatarStore = window.AvatarStore || { imageUrl: null, setImage(url){ this.imageUrl = url; try{ window.dispatchEvent(new CustomEvent('avatarUpdated',{ detail:{ avatarUrl: url } })); }catch(e){} }, getImage(){ return this.imageUrl } };
                  window.AvatarStore.setImage(dataUrl);
                }

                // Dispatch on document as well for modules listening there
                try { document.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: dataUrl } })); } catch (e) { /* ignore */ }
              } catch (e) {
                console.warn('Failed to set AvatarStore with prefetched data URL', e);
              }
            }
          }
        } catch (e) {
          console.warn('Prefetch avatar failed or timed out', e);
          // Don't block UI; leave AvatarStore alone so consumers fallback
        }
      }
    } catch (e) {
      console.warn('Avatar prefetch unexpected error', e);
    } finally {
      // Mark that user data is loaded in memory and notify listeners
      try { window.userDataReady = true; } catch (e) { /* ignore */ }
      try { document.dispatchEvent(new CustomEvent('userDataReady')); } catch (e) { /* ignore */ }
    }
  })();
}

/**
 * Main login/signup handler
 */
async function handleLogin(e) {
  if (e?.preventDefault) e.preventDefault();

  // Mark that user data is not yet loaded while login is in progress
  try { window.userDataReady = false; } catch (e) { /* ignore */ }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  window.clearAllErrors?.();

  // Validate basic fields
  if (!validateCredentials(email, password)) return;

  const supabaseAvailable = !!(window.supabase && window.SUPABASE_URL && window.supabaseReady);

  if (app.isSignupMode) {
    // Handle signup
    const passwordConfirm = document.getElementById('password-confirm').value;

    if (!validateCredentials(email, password, passwordConfirm)) return;

    try {
      let user;
      if (supabaseAvailable) {
        user = await handleSupabaseSignup(email, password);
        if (!user) return;
      } else {
        if (!handleLocalStorageSignup(email, password)) return;
        user = { email };
      }

      window.showGeneralMessage?.(getString('login.account_created'));
      window.currentUser = user;

      // Reset to login mode after 1.5 seconds
      setTimeout(() => {
        if (app.isSignupMode) {
          toggleSignupMode();
        }
      }, 1500);
    } catch (err) {
      console.error('Signup exception:', err);
      window.showGeneralMessage?.(err.message || getString('login.signup_error'));
    }
  } else {
    // Handle login
    if (!supabaseAvailable) {
      window.showGeneralMessage?.(getString('login.login_failed'));
      return;
    }

    try {
      const result = await handleSupabaseLogin(email, password, rememberMe);
      if (!result) return;

      handleAuthSuccess(result.user, result.profileData);
    } catch (err) {
      console.error('Login exception:', err);
      window.showGeneralMessage?.(err.message || getString('login.login_failed'));
    }
  }
}

/**
 * Handle logout for the app
 * - Calls Supabase signOut when available
 * - Clears client-side auth state and remembered email
 * - Updates UI to logged-out state
 */
async function handleLogout() {
  try {
    // Use mouse cursor 'wait' and block interactions (no visible overlays)
    try {
      try { window.isLoggingOut = true; } catch (e) { /* ignore */ }
      try { document.dispatchEvent(new CustomEvent('userLoggingOut')); } catch (e) { /* ignore */ }
      try { document.body.setAttribute('data-blocked', 'true'); } catch (e) { /* ignore */ }

      if (!document.getElementById('logout-cursor-style')) {
        const style = document.createElement('style');
        style.id = 'logout-cursor-style';
        style.innerHTML = `
          body[data-blocked="true"] { cursor: wait !important; }
          body[data-blocked="true"] * { pointer-events: none !important; user-select: none !important; }
        `;
        document.head.appendChild(style);
      }
    } catch (e) {
      console.warn('Failed to enable logout cursor block', e);
    }

    // Close and remove profile dropdown immediately
    try {
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) {
        dropdown.classList.remove('visible');
        try { dropdown.remove(); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    // Ensure persisted avatar is cleared and common avatar DOM nodes are reset
    try {
      try { localStorage.removeItem('avatar:image'); } catch (e) { /* ignore */ }

      const preview = document.getElementById('avatar-preview');
      if (preview) {
        try { preview.src = ''; } catch (e) {}
        try { preview.style.display = 'none'; } catch (e) {}
      }

      const profileImg = document.querySelector('#profile-avatar img');
      if (profileImg && profileImg.parentNode) {
        try { profileImg.parentNode.removeChild(profileImg); } catch (e) { /* ignore */ }
      }

      const toolbarImg = document.querySelector('#toolbar-avatar img');
      if (toolbarImg && toolbarImg.parentNode) {
        try { toolbarImg.parentNode.removeChild(toolbarImg); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    // Clear avatar image placeholder (do not disable the button)
    try {
      const toolbarAvatar = document.getElementById('toolbar-avatar');
      if (toolbarAvatar) toolbarAvatar.innerHTML = '';
      // Clear both persisted image and any transient preview so all
      // consumers (toolbar, placeholders, onboarding) update.
      if (window.AvatarStore) {
        try { if (typeof window.AvatarStore.setPreview === 'function') window.AvatarStore.setPreview(null); } catch (e) { /* ignore */ }
        try { if (typeof window.AvatarStore.setImage === 'function') window.AvatarStore.setImage(null); } catch (e) { /* ignore */ }
      } else {
        // Fallback: dispatch events so listeners update even without a store
        try { window.dispatchEvent(new CustomEvent('avatarPreviewChanged', { detail: { avatarUrl: null } })); } catch (e) { /* ignore */ }
        try { document.dispatchEvent(new CustomEvent('avatarPreviewChanged', { detail: { avatarUrl: null } })); } catch (e) { /* ignore */ }
        try { window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: null } })); } catch (e) { /* ignore */ }
        try { document.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: null } })); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    // Perform server-side sign out while spinner is visible
    try {
      if (window.supabase && typeof window.supabase.auth?.signOut === 'function') {
        await window.supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signOut failed', e);
    }

    // Clear in-memory state
    try {
      window.currentUser = null;
      window.userNeedsOnboarding = false;
      try { window.userDataReady = false; } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }

    // Clear persisted traces
    try {
      localStorage.removeItem('rememberedEmail');
      try { localStorage.removeItem('sb:token'); } catch (e) { /* ignore */ }
      try { localStorage.removeItem('language_chosen_by_user'); } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }

    // Wait a short moment to ensure cleanup completed
    await new Promise(resolve => setTimeout(resolve, 150));

    // Remove cursor-block and notify
    try { document.body.removeAttribute('data-blocked'); } catch (e) { /* ignore */ }
    try { const st = document.getElementById('logout-cursor-style'); if (st) st.remove(); } catch (e) { /* ignore */ }
    try { document.dispatchEvent(new CustomEvent('userDataCleared')); } catch (e) { /* ignore */ }
    try { window.isLoggingOut = false; } catch (e) { /* ignore */ }

    // Now transition to logged-out UI
    // Hide all direct children of the main app container so any mounted
    // in-flow containers (home, onboarding, views, etc.) are hidden on logout.
    try {
      const main = document.getElementById('main-container');
      if (main) {
        Array.from(main.children).forEach(child => {
          try {
            // remove visible class and hide by display to ensure it's not interactive
            if (child.classList) child.classList.remove('visible');
            child.style.display = 'none';
          } catch (e) { /* ignore per-child errors */ }
        });
      }
    } catch (e) { /* ignore */ }

    if (typeof setUiForAuthState === 'function') {
      setUiForAuthState(false);
    } else {
      try {
        if (typeof loadView === 'function') loadView('login');
      } catch (e) {
        window.location.reload();
      }
    }
  } catch (err) {
    console.error('Logout failed:', err);
    if (typeof window.showGeneralMessage === 'function') {
      window.showGeneralMessage(getString ? getString('profile.logout_failed') || 'Logout failed' : 'Logout failed');
    }
    throw err;
  }
}

// Export to window so profile component can call it
window.handleLogout = handleLogout;
