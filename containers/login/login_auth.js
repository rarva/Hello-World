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
}

/**
 * Main login/signup handler
 */
async function handleLogin(e) {
  if (e?.preventDefault) e.preventDefault();

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
    // Call Supabase signOut if available
    if (window.supabase && typeof window.supabase.auth?.signOut === 'function') {
      await window.supabase.auth.signOut();
    }

    // Clear client state
    window.currentUser = null;
    window.userNeedsOnboarding = false;

    try {
      localStorage.removeItem('rememberedEmail');
    } catch (e) {
      // ignore storage errors
    }

    // Update UI
    if (typeof setUiForAuthState === 'function') {
      setUiForAuthState(false);
    } else {
      // fallback: attempt to reload to a logged-out state
      try {
        if (typeof loadView === 'function') loadView('login');
      } catch (e) {
        // final fallback: reload the page
        window.location.reload();
      }
    }
  } catch (err) {
    console.error('Logout failed:', err);
    if (typeof window.showGeneralMessage === 'function') {
      window.showGeneralMessage(getString ? getString('profile.logout_failed') || 'Logout failed' : 'Logout failed');
    }
    // rethrow so callers can surface error if needed
    throw err;
  }
}

// Export to window so profile component can call it
window.handleLogout = handleLogout;
