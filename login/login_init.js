// ===============================
// Login Module
// ===============================
// This module handles all login and signup logic, separated from load_control.js

// Global app state - initialize only after checking localStorage safely
window.app = window.app || {
  isSignupMode: false,
  users: (() => {
    try {
      return JSON.parse(localStorage.getItem('users') || '{}');
    } catch (e) {
      return {};
    }
  })()
};

/**
 * Initialize login container: load HTML and styles
 */
function initLoginContainer() {
  fetch('login/login.html')
    .then(res => res.text())
    .then(html => {
      const loginContainer = document.getElementById('login-container');
      loginContainer.innerHTML = html;
      
      // Load login styles
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'login/login_styles.css';
      document.head.appendChild(style);
      
      // Initialize login after HTML is present
      initLogin();
    })
    .catch(err => {
      showFieldError('Failed to load login page');
      console.error('Failed to load login:', err);
    });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Navigate to a view/page
 */
function loadView(viewName) {
  // Hide login container
  const loginContainer = document.getElementById('login-container');
  if (loginContainer) {
    loginContainer.style.display = 'none';
  }
  
  // Show toolbar container
  const toolbarContainer = document.getElementById('toolbar-container');
  if (toolbarContainer) {
    toolbarContainer.classList.add('visible');
  }
  
  // Load home content into home container
  const homeContainer = document.getElementById('home-container');
  if (homeContainer) {
    fetch('home/' + viewName + '.html')
      .then(res => res.text())
      .then(html => {
        homeContainer.innerHTML = html;
        homeContainer.classList.add('visible');
      })
      .catch(err => {
        console.error('Failed to load view:', err);
        homeContainer.innerHTML = '<div style="color:red">Failed to load ' + viewName + '.</div>';
        homeContainer.classList.add('visible');
      });
  }
}

/**
 * Initialize Supabase client
 */
function initSupabase() {
  // Placeholder for Supabase initialization
  // In production, this would set up window.supabase and window.SUPABASE_URL
  console.log('Supabase initialization placeholder');
}

/**
 * If a user is remembered, pre-fill the email field and check the box.
 */
function checkRememberedUser() {
  const remembered = localStorage.getItem('rememberedEmail');
  if (remembered) {
    const emailInput = document.getElementById('email');
    const rememberCheckbox = document.getElementById('remember-me');
    if (emailInput) emailInput.value = remembered;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}

/**
 * Initialize login form and wire up events
 */
async function initLogin() {
  // Wait for Supabase to be ready if it's configured
  if (window.SUPABASE_URL && !window.supabaseReady) {
    await new Promise(resolve => {
      const checkSupabase = setInterval(() => {
        if (window.supabaseReady || window.supabase) {
          clearInterval(checkSupabase);
          resolve();
        }
      }, 100);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkSupabase);
        resolve();
      }, 5000);
    });
  }

  // Language switcher logic for login view
  var langBtn = document.getElementById('lang-btn');
  var langSelect = document.getElementById('lang-select');
  
  // Only set language if element exists
  if (langSelect && typeof getLanguage === 'function') {
    try {
      langSelect.value = getLanguage();
    } catch (e) {
      console.warn('Failed to set language select value:', e);
    }
  }
  
  if (langBtn && langSelect) {
    langBtn.addEventListener('click', function() {
      langSelect.style.display = langSelect.style.display === 'none' ? 'block' : 'none';
    });
    langSelect.addEventListener('change', function(e) {
      setLanguage(e.target.value);
      langSelect.style.display = 'none';
      location.reload();
    });
  }
  // Rule 1: Set all visible text from strings.json ONLY after strings are loaded
  await loadStrings();
  if (window.getString) {
    const setText = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = getString(key);
    };
    setText('brand-name', 'login.brand_name');
    setText('brand-subtitle', 'login.brand_subtitle');
    setText('email-label', 'login.email');
    setText('password-label', 'login.password');
    setText('signup-confirm-label', 'login.confirm_password');
    setText('remember-text', 'login.remember_me');
    setText('forgot-password', 'login.forgot_password');
    setText('login-btn', 'login.login');
    setText('footer-signup-text', 'login.signup');
    setText('footer-first-use', 'login.first_login');
    // Placeholders
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.placeholder = getString('login.email_placeholder');
    const passwordInput = document.getElementById('password');
    if (passwordInput) passwordInput.placeholder = getString('login.password_placeholder');
    const confirmInput = document.getElementById('password-confirm');
    if (confirmInput) confirmInput.placeholder = getString('login.password_placeholder');
  }

  // ...existing code...

  // Continue with event wiring and logic after text is set
  // Wire form submit event so validation runs on Enter or button click
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const footerSignupText = document.getElementById('footer-signup-text');
  if (footerSignupText) {
    footerSignupText.addEventListener('click', toggleSignupMode);
  }

  const togglePasswordBtn = document.getElementById('toggle-password');
  if (togglePasswordBtn) {
    // Initialize eye button state (password fields start as type="password", so state is "hidden")
    togglePasswordBtn.setAttribute('data-state', 'hidden');
    togglePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordVisibility('password');
    });
  }

  const toggleConfirmBtn = document.getElementById('toggle-confirm');
  if (toggleConfirmBtn) {
    // Initialize eye button state (password fields start as type="password", so state is "hidden")
    toggleConfirmBtn.setAttribute('data-state', 'hidden');
    toggleConfirmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordVisibility('password-confirm');
    });
  }

  // Restore remembered user
  checkRememberedUser();
}

/**
 * Toggle password field visibility.
 * @param {string} fieldId - ID of the password field
 */
function togglePasswordVisibility(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  
  // Update eye button state for opacity control
  const button = fieldId === 'password' ? document.getElementById('toggle-password') : document.getElementById('toggle-confirm');
  if (button) {
    button.setAttribute('data-state', isPassword ? 'showing' : 'hidden');
  }
}

/**
 * Toggle between login and signup modes.
 */
function toggleSignupMode() {
  app.isSignupMode = !app.isSignupMode;
  const confirmGroup = document.getElementById('confirm-group');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const footerFirstUse = document.getElementById('footer-first-use');
  const footerSignupText = document.getElementById('footer-signup-text');

  if (app.isSignupMode) {
    if (confirmGroup) confirmGroup.style.display = 'block';
    if (loginBtn) loginBtn.textContent = getString('login.signup');
    if (signupBtn) signupBtn.textContent = getString('login.back_to_login');
    // Change footer message to "Already have an account? Login"
    if (footerFirstUse) footerFirstUse.textContent = getString('login.already_registered');
    if (footerSignupText) footerSignupText.textContent = getString('login.login');
  } else {
    if (confirmGroup) confirmGroup.style.display = 'none';
    if (loginBtn) loginBtn.textContent = getString('login.login');
    if (signupBtn) signupBtn.textContent = getString('login.signup');
    // Change footer message back to "First login? Sign up"
    if (footerFirstUse) footerFirstUse.textContent = getString('login.first_login');
    if (footerSignupText) footerSignupText.textContent = getString('login.signup');
  }
  clearAllErrors();
}
