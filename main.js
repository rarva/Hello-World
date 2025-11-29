// ===============================
// Main App Module
// ===============================
// Orchestrates container loading and session management

/**
 * Check if user has an active Supabase session
 */
async function checkExistingSession() {
  // Wait for Supabase to be ready
  if (!window.supabase) {
    return false;
  }
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
      console.log('Active session found for:', session.user.email);
      
      // Store current user
      window.currentUser = session.user;
      
      // Get user's profile data (language + mandatory fields)
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .select('language, first_name, last_name, reports_to_email')
          .eq('email', session.user.email)
          .single();

        // If the profiles query returned an error or no row, treat the
        // session as unauthenticated. This prevents showing onboarding when
        // the DB rows were deleted but the browser still has an auth session.
        if (profileError || !profileData) {
          console.warn('checkExistingSession: profile missing or query error, signing out', profileError);
          try {
            if (window.supabase && typeof window.supabase.auth?.signOut === 'function') {
              await window.supabase.auth.signOut();
            }
          } catch (e) { /* ignore signOut errors */ }
          try { localStorage.removeItem('sb:token'); } catch (e) { /* ignore */ }
          try { localStorage.removeItem('sb:auth'); } catch (e) { /* ignore */ }
          try { localStorage.removeItem('rememberedEmail'); } catch (e) { /* ignore */ }
          window.currentUser = null;
          window.userNeedsOnboarding = false;
          return false;
        }

        if (profileData && profileData.language && typeof updateLanguageFromProfile === 'function') {
          updateLanguageFromProfile(profileData.language);
        }

        // Check if user needs to complete onboarding (missing mandatory fields)
        const needsOnboarding = !profileData?.first_name || !profileData?.last_name || !profileData?.reports_to_email;
        window.userNeedsOnboarding = needsOnboarding;

        return true;
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
  
  return false;
}

/**
 * Toggle UI visibility based on auth state
 */
function setUiForAuthState(isLoggedIn) {
  const loginContainer = document.getElementById('login-container');
  const toolbarContainer = document.getElementById('toolbar-container');
  const onboardingContainer = document.getElementById('onboarding-container');
  const homeContainer = document.getElementById('home-container');
  const footerContainer = document.getElementById('footer-container');
  
  if (isLoggedIn) {
    // User logged in: hide login, show toolbar/footer
    if (loginContainer) loginContainer.style.display = 'none';
    if (toolbarContainer) toolbarContainer.classList.add('visible');
    if (footerContainer) footerContainer.classList.add('visible');
    
    // Check if onboarding needed
    if (window.userNeedsOnboarding) {
      // Show onboarding instead of home
      if (onboardingContainer) onboardingContainer.classList.add('visible');
      if (homeContainer) homeContainer.classList.remove('visible');
      if (typeof initializeOnboarding === 'function') {
        initializeOnboarding();
      }
    } else {
      // Show home
      if (onboardingContainer) onboardingContainer.classList.remove('visible');
      if (homeContainer) homeContainer.classList.add('visible');
      if (typeof loadView === 'function') {
        loadView('home');
      }
    }
  } else {
    // User not logged in: show login, hide other containers
    if (loginContainer) loginContainer.style.display = 'flex';
    if (toolbarContainer) toolbarContainer.classList.remove('visible');
    if (onboardingContainer) onboardingContainer.classList.remove('visible');
    if (homeContainer) homeContainer.classList.remove('visible');
    if (footerContainer) footerContainer.classList.remove('visible');
  }
}
function setUiForAuthState(isLoggedIn) {
  const loginContainer = document.getElementById('login-container');
  const toolbarContainer = document.getElementById('toolbar-container');
  const onboardingContainer = document.getElementById('onboarding-container');
  const homeContainer = document.getElementById('home-container');
  const footerContainer = document.getElementById('footer-container');
  
  if (isLoggedIn) {
    // User logged in: hide login, show toolbar/footer
    if (loginContainer) loginContainer.style.display = 'none';
    if (toolbarContainer) toolbarContainer.classList.add('visible');
    if (footerContainer) footerContainer.classList.add('visible');
    
    // Check if onboarding needed
    if (window.userNeedsOnboarding) {
      // Show onboarding instead of home
      if (onboardingContainer) onboardingContainer.classList.add('visible');
      if (homeContainer) homeContainer.classList.remove('visible');
      if (typeof initializeOnboarding === 'function') {
        initializeOnboarding();
      }
    } else {
      // Show home
      if (onboardingContainer) onboardingContainer.classList.remove('visible');
      if (homeContainer) homeContainer.classList.add('visible');
      if (typeof loadView === 'function') {
        loadView('home');
      }
    }
  } else {
    // User not logged in: show login, hide other containers
    if (loginContainer) loginContainer.style.display = 'flex';
    if (toolbarContainer) toolbarContainer.classList.remove('visible');
    if (onboardingContainer) onboardingContainer.classList.remove('visible');
    if (homeContainer) homeContainer.classList.remove('visible');
    if (footerContainer) footerContainer.classList.remove('visible');
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // Wait for Supabase to be ready
  let supabaseReady = false;
  const startTime = Date.now();
  const timeout = 5000; // 5 seconds
  
  while (!supabaseReady && (Date.now() - startTime) < timeout) {
    if (window.supabase) {
      supabaseReady = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Check if user already has an active session BEFORE loading containers
  let hasSession = await checkExistingSession();

  // If the link includes a force_signout request (from emailed validate link)
  // and the browser currently has a different authenticated session, sign
  // out the current session so the manager can sign in. This handles the
  // common case where the manager clicks the email in the same browser
  // where the new user completed onboarding.
  try {
    const qpEarly = new URLSearchParams(window.location.search || '');
    const force = qpEarly.get('force_signout') === '1';
    const prefill = qpEarly.get('prefill_email');
    if (force && hasSession && prefill && window.currentUser && window.currentUser.email && String(window.currentUser.email).toLowerCase() !== String(prefill).toLowerCase()) {
      try {
        if (window.supabase && typeof window.supabase.auth?.signOut === 'function') {
          await window.supabase.auth.signOut();
        }
      } catch (e) { /* ignore signOut errors */ }
      try { localStorage.removeItem('sb:token'); } catch (e) { /* ignore */ }
      try { localStorage.removeItem('sb:auth'); } catch (e) { /* ignore */ }
      try { localStorage.removeItem('rememberedEmail'); } catch (e) { /* ignore */ }
      window.currentUser = null;
      window.userNeedsOnboarding = false;
      hasSession = false;
    }
  } catch (e) { /* ignore */ }
  
  // Load all containers
  if (typeof initLoginContainer === 'function') initLoginContainer();
  if (typeof initToolbarContainer === 'function') initToolbarContainer();
  if (typeof initFooterContainer === 'function') initFooterContainer();
  if (typeof initHomeContainer === 'function') initHomeContainer();
  
  // Set UI based on auth state immediately (no delay)
  setUiForAuthState(hasSession);

  // If the app was opened with `?open_requests=1` and the user is
  // authenticated, open the Requests container automatically so managers
  // land directly on their pending requests after login.
  try {
    const qp = new URLSearchParams(window.location.search || '');
    if (qp.get('open_requests') === '1' && hasSession && typeof window.openRequests === 'function') {
      console.info('main: auto-opening requests on DOMContentLoaded');
      // Small timeout to ensure containers loaded
      setTimeout(() => { try { console.debug('main: calling openRequests() from DOMContentLoaded'); window.openRequests(); } catch (e) { console.warn('main: openRequests call failed', e); } }, 150);
    }
  } catch (e) { /* ignore */ }

  // If the app wasn't authenticated at initial load, listen for a later
  // "userDataReady" event which is dispatched after login succeeds and
  // profile/avatar prefetch finishes. This ensures `?open_requests=1`
  // will still open Requests even when session wasn't ready on DOMContentLoaded.
  try {
    document.addEventListener('userDataReady', function onUserDataReady() {
      try {
        const qp2 = new URLSearchParams(window.location.search || '');
        if (qp2.get('open_requests') === '1' && typeof window.openRequests === 'function') {
          console.info('main: auto-opening requests on userDataReady');
          setTimeout(() => { try { console.debug('main: calling openRequests() from userDataReady'); window.openRequests(); } catch (e) { console.warn('main: openRequests call failed', e); } }, 120);
        }
      } catch (e) { /* ignore */ }
      // Remove listener after first run
      try { document.removeEventListener('userDataReady', onUserDataReady); } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }
});
