// ===============================
// Global State
// ===============================
// Holds app-wide state, including current view, signup mode, and demo users.
const app = {
  currentView: null, // Tracks which view is loaded
  isSignupMode: false, // True if signup form is active
  users: JSON.parse(localStorage.getItem('users')) || {
    'admin@example.com': 'admin@example.com:1234' // Demo user (email:password)
  }
};

// ===============================
// UI Helper Functions
// ===============================

/**
 * Update the Supabase connection indicator in the UI.
 * @param {boolean} online - True if Supabase is connected
 */
function setSupabaseIndicator(online) {
  const indicator = document.getElementById('supabase-indicator');
  const statusText = document.getElementById('supabase-text');
  if (!indicator) return;
  
  if (statusText) {
    statusText.textContent = online ? getString('login.supabase_connected').split(': ')[1] : getString('login.supabase_offline').split(': ')[1];
  }
  indicator.classList.toggle('online', online);
  indicator.classList.toggle('offline', !online);
}

// ===============================
// Supabase Initialization
// ===============================

/**
 * Initialize Supabase client if config is present.
 * Falls back to localStorage if no config found.
 */
function initSupabase() {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      setSupabaseIndicator(false);
      return;
    }

    setSupabaseIndicator(false);

    if (window.supabase) {
      setSupabaseIndicator(true);
      return;
    }

    if (document.querySelector('script[data-supabase-client]')) return;

    const s = document.createElement('script');
    s.src = 'supabase_client.js';
    s.defer = true;
    s.setAttribute('data-supabase-client', '1');
    document.head.appendChild(s);

    // Poll for the client to appear
    let attempts = 0;
    const maxAttempts = 12;
    const iv = setInterval(() => {
      attempts += 1;
      if (window.supabase) {
        setSupabaseIndicator(true);
        clearInterval(iv);
      } else if (attempts >= maxAttempts) {
        setSupabaseIndicator(false);
        clearInterval(iv);
      }
    }, 250);
  } catch (err) {
    console.warn('Supabase init failed:', err);
    setSupabaseIndicator(false);
  }
}

// ===============================
// View Loading
// ===============================

/**
 * Load a view by name and inject into #app or body.
 * @param {string} viewName - Name of the view file (without .html)
 */
function loadView(viewName) {
  if (viewName === 'login') {
    // Load login directly into body so it bypasses #app constraints
    fetch(`login/${viewName}.html`)
      .then(res => res.text())
      .then(html => {
        // Replace entire document
        document.documentElement.innerHTML = html;
        
        // Fix relative paths in stylesheets loaded from login folder
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('/') && !href.startsWith('http')) {
            // If path doesn't start with ../ or /, make it relative to login folder
            if (!href.startsWith('../') && href.startsWith('./')) {
              link.setAttribute('href', 'login/' + href.substring(2));
            } else if (!href.startsWith('../')) {
              link.setAttribute('href', 'login/' + href);
            }
          }
        });
        
        // Fix relative paths in scripts loaded from login folder
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
          const src = script.getAttribute('src');
          if (src && !src.startsWith('/') && !src.startsWith('http')) {
            if (!src.startsWith('../')) {
              script.setAttribute('src', 'login/' + src);
            }
          }
        });
        
        // Load error handling script first
        const errorScript = document.createElement('script');
        errorScript.src = 'login/login_error_handling.js';
        errorScript.defer = true;
        errorScript.onload = () => {
          // Then load login-specific script
          const loginScript = document.createElement('script');
          loginScript.src = 'login/load_login.js';
          loginScript.defer = true;
          loginScript.onload = () => {
            app.currentView = viewName;
            initLogin();
          };
          document.head.appendChild(loginScript);
        };
        document.head.appendChild(errorScript);
      })
      .catch(err => console.error('Failed to load view:', err));
  } else {
    // For other views, load into #app normally
    fetch(`${viewName}.html`)
      .then(res => res.text())
      .then(html => {
        document.getElementById('app').innerHTML = html;
        app.currentView = viewName;

        // Initialize view-specific functions
        if (viewName === 'home') initHome();
      })
      .catch(err => console.error('Failed to load view:', err));
  }
}

// ===============================
// Home Functions
// ===============================

/**
 * Initialize home view.
 */
function initHome() {
  console.log('Home view initialized');
}

// ===============================
// App Initialization
// ===============================

/**
 * Initialize the application by loading the login view.
 */
window.addEventListener('DOMContentLoaded', () => {
  loadView('login');
});
