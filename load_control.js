
// Check if user has an active Supabase session
async function checkExistingSession() {
  // Wait for Supabase to be ready
  if (!window.supabase) {
    return false;
  }
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
      console.log('Active session found for:', session.user.email);
      
      // Get user's language preference from profile
      const { data: profileData } = await window.supabase
        .from('profiles')
        .select('language')
        .eq('email', session.user.email)
        .single();
      
      if (profileData && profileData.language && typeof updateLanguageFromProfile === 'function') {
        updateLanguageFromProfile(profileData.language);
      }
      
      return true;
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
  
  return false;
}

// Loader: loads login and footer containers into #main-container
function loadContainers() {
  // Load login content into existing placeholder
  fetch('login/login.html')
    .then(res => res.text())
    .then(html => {
      const loginContainer = document.getElementById('login-container');
      loginContainer.innerHTML = html;
      
      // Ensure initLogin is called after DOM is updated
      if (typeof initLogin === 'function') {
        initLogin();
      } else {
        const script = document.createElement('script');
        script.src = 'login/load_login.js';
        script.onload = () => {
          if (typeof initLogin === 'function') initLogin();
        };
        document.body.appendChild(script);
      }
    })
    .catch(err => {
      const loginContainer = document.getElementById('login-container');
      loginContainer.innerHTML = '<div style="color:red">Failed to load login form.</div>';
      console.error('Failed to load login form:', err);
    });

  // Load footer content into existing placeholder
  fetch('footer/footer.html')
    .then(res => res.text())
    .then(html => {
      const footerContainer = document.getElementById('footer-container');
      footerContainer.innerHTML = html;
      
      // Load footer JS after HTML is present
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'footer/footer_styles.css';
      document.head.appendChild(style);
      const script = document.createElement('script');
      script.src = 'footer/load_footer.js';
      document.body.appendChild(script);
      const errorScript = document.createElement('script');
      errorScript.src = 'footer/footer_error_handling.js';
      document.body.appendChild(errorScript);
    });
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
  
  // Check if user already has an active session
  const hasSession = await checkExistingSession();
  
  if (hasSession) {
    // User is still logged in, load home page directly
    if (typeof loadView === 'function') {
      loadView('home');
      // Still load footer
      fetch('footer/footer.html')
        .then(res => res.text())
        .then(html => {
          const footerContainer = document.getElementById('footer-container');
          footerContainer.innerHTML = html;
          const style = document.createElement('link');
          style.rel = 'stylesheet';
          style.href = 'footer/footer_styles.css';
          document.head.appendChild(style);
          const script = document.createElement('script');
          script.src = 'footer/load_footer.js';
          document.body.appendChild(script);
          const errorScript = document.createElement('script');
          errorScript.src = 'footer/footer_error_handling.js';
          document.body.appendChild(errorScript);
        });
    } else {
      // loadView not available yet, load containers normally
      loadContainers();
    }
  } else {
    // No session, show login
    loadContainers();
  }
});
