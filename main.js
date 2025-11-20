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
      const { data: profileData } = await window.supabase
        .from('profiles')
        .select('language, first_name, last_name, reports_to_email')
        .eq('email', session.user.email)
        .single();
      
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
  const hasSession = await checkExistingSession();
  
  // Load all containers
  if (typeof initLoginContainer === 'function') initLoginContainer();
  if (typeof initToolbarContainer === 'function') initToolbarContainer();
  if (typeof initFooterContainer === 'function') initFooterContainer();
  if (typeof initHomeContainer === 'function') initHomeContainer();
  
  // Set UI based on auth state immediately (no delay)
  setUiForAuthState(hasSession);
});
