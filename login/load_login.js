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
  
  // Load shell content into shell container
  const shellContainer = document.getElementById('shell-container');
  if (shellContainer) {
    fetch(viewName + '.html')
      .then(res => res.text())
      .then(html => {
        shellContainer.innerHTML = html;
        shellContainer.style.display = 'flex';
      })
      .catch(err => {
        console.error('Failed to load view:', err);
        shellContainer.innerHTML = '<div style="color:red">Failed to load ' + viewName + '.</div>';
        shellContainer.style.display = 'flex';
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
 * Show a field-specific error message and highlight the field.
 * @param {string} field - Field name ('email', 'password', 'confirm')
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
  const errorId = field === 'confirm' ? 'confirm-error' : `${field}-error`;
  const inputId = field === 'confirm' ? 'password-confirm' : field;
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  if (inputEl) {
    inputEl.classList.add('error');
  }
}

/**
 * Show a general error or info message at the top of the form.
 * @param {string} message
 */
function showGeneralMessage(message) {
  const generalError = document.getElementById('general-error');
  if (generalError) {
    generalError.textContent = message;
    generalError.style.display = 'block';
  }
}

/**
 * Clear all error messages and field highlights in the form.
 */
function clearAllErrors() {
  const errorIds = ['email-error', 'password-error', 'confirm-error', 'general-error'];
  const inputIds = ['email', 'password', 'password-confirm'];
  errorIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  inputIds.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.classList.remove('error');
  });
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
    togglePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordVisibility('password');
    });
  }

  const toggleConfirmBtn = document.getElementById('toggle-confirm');
  if (toggleConfirmBtn) {
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

/**
 * Handle login and signup form submission.
 */
async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  clearAllErrors();

  if (!email || !password) {
    if (!email) showFieldError('email', getString('login.email_required'));
    if (!password) showFieldError('password', getString('login.password_required'));
    return;
  }

  if (!isValidEmail(email)) {
    showFieldError('email', getString('login.invalid_email'));
    return;
  }

  // Check if Supabase is available (check for both window.supabase and window.SUPABASE_URL)
  const supabaseAvailable = !!(window.supabase && window.SUPABASE_URL && window.supabaseReady);

  if (app.isSignupMode) {
    // Handle signup
    const passwordConfirm = document.getElementById('password-confirm').value;

    if (password !== passwordConfirm) {
      showFieldError('confirm', getString('login.passwords_dont_match'));
      return;
    }

    if (supabaseAvailable) {
      try {
        console.log('Attempting signup for:', email);
        const { data: signUpData, error: signUpError } = await window.supabase.auth.signUp({ email, password });
        console.log('Signup response:', { data: signUpData, error: signUpError });
        console.log('User created:', signUpData?.user?.id);
        console.log('Session:', signUpData?.session);
        
        if (signUpError) {
          console.error('Signup error:', signUpError);
          showGeneralMessage(signUpError.message);
          return;
        }

        // Create profile row with language preference
        console.log('Creating profile for:', email);
        const currentLang = typeof getLanguage === 'function' ? getLanguage() : 'pt';
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .insert([{ email, full_name: '', language: currentLang }])
          .select()
          .single();

        console.log('Profile response:', { data: profileData, error: profileError });
        
        if (profileError) {
          console.error('Profile error:', profileError);
          // Check if it's a duplicate key error (email already exists)
          if (profileError.message && profileError.message.includes('unique constraint')) {
            showGeneralMessage(getString('login.email_already_registered'));
          } else {
            showGeneralMessage(profileError.message || getString('login.signup_error'));
          }
          return;
        }

        showGeneralMessage(getString('login.account_created'));
        
        // Clear only the password confirm field
        document.getElementById('password-confirm').value = '';
        
        // Switch back to login form after brief delay
        setTimeout(() => {
          app.isSignupMode = false;
          
          // Update UI to show login form
          const confirmGroup = document.getElementById('confirm-group');
          const loginBtn = document.getElementById('login-btn');
          const signupBtn = document.getElementById('signup-btn');
          const footerFirstUse = document.getElementById('footer-first-use');
          const footerSignupText = document.getElementById('footer-signup-text');
          
          if (confirmGroup) confirmGroup.style.display = 'none';
          if (loginBtn) loginBtn.textContent = getString('login.login');
          if (signupBtn) signupBtn.textContent = getString('login.signup');
          if (footerFirstUse) footerFirstUse.textContent = getString('login.first_login');
          if (footerSignupText) footerSignupText.textContent = getString('login.signup');
          clearAllErrors();
        }, 1500);
        return;
      } catch (err) {
        console.error('Signup exception:', err);
        showGeneralMessage(err.message || getString('login.signup_error'));
        return;
      }
    }

    // Fallback: localStorage signup
    if (app.users && app.users[email]) {
      showFieldError('email', getString('login.email_already_registered'));
      return;
    }

    // Ensure app.users exists before setting
    if (!app.users) {
      app.users = {};
    }
    app.users[email] = `${email}:${password}`;
    localStorage.setItem('users', JSON.stringify(app.users));
    showGeneralMessage(getString('login.account_created'));
    setTimeout(() => {
      app.isSignupMode = false;
      toggleSignupMode();
    }, 1500);
  } else {
    // Handle login
    if (supabaseAvailable) {
      try {
        console.log('Attempting login for:', email);
        
        // First check if email exists in profiles table
        const { data: profileExists, error: profileCheckError } = await window.supabase
          .from('profiles')
          .select('email')
          .eq('email', email)
          .single();
        
        if (!profileExists) {
          console.log('Email not found in database');
          showGeneralMessage(getString('login.email_not_found'));
          return;
        }
        
        // Email exists, now try to authenticate with password
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        console.log('Login response:', { data, error });
        
        if (error) {
          console.error('Login error:', error);
          // Check for specific error types
          if (error.message && error.message.includes('Email not confirmed')) {
            showGeneralMessage(getString('login.email_not_confirmed'));
          } else {
            // Invalid credentials means wrong password (since we already verified email exists)
            showGeneralMessage(getString('login.wrong_password'));
          }
          return;
        }

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Fetch user's language preference from profile
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .select('language')
          .eq('email', email)
          .single();
        
        if (profileData && profileData.language && typeof updateLanguageFromProfile === 'function') {
          updateLanguageFromProfile(profileData.language);
        }

        loadView('home');
        return;
      } catch (err) {
        showGeneralMessage(err.message || getString('login.login_failed'));
        return;
      }
    } else {
      // If Supabase is not available, show error
      showGeneralMessage(getString('login.login_failed'));
    }
  }
}
