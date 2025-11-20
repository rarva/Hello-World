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
 * Load stylesheet helper
 */
function loadStylesheet(href) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = href;
    document.head.appendChild(style);
  }
}

/**
 * Initialize login container: load HTML and styles
 */
function initLoginContainer() {
  fetch('containers/login/login.html')
    .then(res => res.text())
    .then(html => {
      const loginContainer = document.getElementById('login-container');
      loginContainer.innerHTML = html;
      loadStylesheet('containers/login/login_styles.css');
      initLogin();
    })
    .catch(err => {
      window.showFieldError?.('Failed to load login page');
      console.error('Failed to load login:', err);
    });
}

/**
 * Navigate to a view/page
 */
function loadView(viewName) {
  const loginContainer = document.getElementById('login-container');
  const toolbarContainer = document.getElementById('toolbar-container');
  const homeContainer = document.getElementById('home-container');

  if (loginContainer) loginContainer.style.display = 'none';
  if (toolbarContainer) toolbarContainer.classList.add('visible');

  if (homeContainer) {
    fetch(`containers/home/${viewName}.html`)
      .then(res => res.text())
      .then(html => {
        homeContainer.innerHTML = html;
        homeContainer.classList.add('visible');
      })
      .catch(err => {
        console.error('Failed to load view:', err);
        homeContainer.innerHTML = `<div style="color:red">Failed to load ${viewName}.</div>`;
        homeContainer.classList.add('visible');
      });
  }
}

/**
 * Restore remembered user email and checkbox state
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
 * Wait for Supabase to be ready
 */
async function waitForSupabase() {
  if (!window.SUPABASE_URL || window.supabaseReady || window.supabase) {
    return; // Already ready or not configured
  }

  return new Promise(resolve => {
    const checkSupabase = setInterval(() => {
      if (window.supabaseReady || window.supabase) {
        clearInterval(checkSupabase);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkSupabase);
      resolve();
    }, 5000); // 5 second timeout
  });
}

/**
 * Set up language switcher
 */
function setupLanguageSwitcher() {
  const langBtn = document.getElementById('lang-btn');
  const langSelect = document.getElementById('lang-select');

  if (!langBtn || !langSelect) return;

  // Set initial language
  if (typeof getLanguage === 'function') {
    try {
      langSelect.value = getLanguage();
    } catch (e) {
      console.warn('Failed to set language select value:', e);
    }
  }

  langBtn.addEventListener('click', () => {
    langSelect.style.display = langSelect.style.display === 'none' ? 'block' : 'none';
  });

  langSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    langSelect.style.display = 'none';
    location.reload();
  });
}

/**
 * Translate login form text
 */
function translateLoginForm() {
  const translations = {
    'brand-name': 'login.brand_name',
    'brand-subtitle': 'login.brand_subtitle',
    'email-label': 'login.email',
    'password-label': 'login.password',
    'signup-confirm-label': 'login.confirm_password',
    'remember-text': 'login.remember_me',
    'forgot-password': 'login.forgot_password',
    'login-btn': 'login.login',
    'footer-signup-text': 'login.signup',
    'footer-first-use': 'login.first_login'
  };

  Object.entries(translations).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = getString(key);
  });

  // Set placeholders
  const placeholders = {
    'email': 'login.email_placeholder',
    'password': 'login.password_placeholder',
    'password-confirm': 'login.password_placeholder'
  };

  Object.entries(placeholders).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = getString(key);
  });
}

/**
 * Set up password visibility toggle button
 */
function setupPasswordToggle(fieldId, buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.setAttribute('data-state', 'hidden');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    togglePasswordVisibility(fieldId);
  });
}

/**
 * Initialize login form and wire up events
 */
async function initLogin() {
  // Wait for Supabase initialization
  await waitForSupabase();

  // Set up language switcher
  setupLanguageSwitcher();

  // Load and set text after strings are ready
  await loadStrings();
  if (window.getString) {
    translateLoginForm();
  }

  // Wire form submit event
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Wire signup mode toggle
  const footerSignupText = document.getElementById('footer-signup-text');
  if (footerSignupText) {
    footerSignupText.addEventListener('click', toggleSignupMode);
  }

  // Set up password visibility toggles
  setupPasswordToggle('password', 'toggle-password');
  setupPasswordToggle('password-confirm', 'toggle-confirm');

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
  const buttonId = fieldId === 'password' ? 'toggle-password' : 'toggle-confirm';
  const button = document.getElementById(buttonId);
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

  const uiState = app.isSignupMode ? {
    confirmDisplay: 'block',
    loginBtnText: 'login.signup',
    signupBtnText: 'login.back_to_login',
    footerFirstUseText: 'login.already_registered',
    footerSignupText: 'login.login'
  } : {
    confirmDisplay: 'none',
    loginBtnText: 'login.login',
    signupBtnText: 'login.signup',
    footerFirstUseText: 'login.first_login',
    footerSignupText: 'login.signup'
  };

  if (confirmGroup) confirmGroup.style.display = uiState.confirmDisplay;
  if (loginBtn) loginBtn.textContent = getString(uiState.loginBtnText);
  if (signupBtn) signupBtn.textContent = getString(uiState.signupBtnText);
  if (footerFirstUse) footerFirstUse.textContent = getString(uiState.footerFirstUseText);
  if (footerSignupText) footerSignupText.textContent = getString(uiState.footerSignupText);

  window.clearAllErrors?.();
}
