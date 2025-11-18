// ===============================
// Login Module
// ===============================
// This module handles all login and signup logic, separated from load_control.js

/**
 * If a user is remembered, pre-fill login fields and check the box.
 */
function checkRememberedUser() {
  const remembered = localStorage.getItem('rememberedUser');
  if (remembered) {
    const [email, password] = remembered.split(':');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember-me');
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}

/**
 * Initialize login form and wire up events
 */
async function initLogin() {
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
    // Supabase indicator
    setText('supabase-text', 'login.supabase_offline');
  }

  // Continue with event wiring and logic after text is set
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
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

  // Initialize Supabase indicator/client
  initSupabase();
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

  if (app.isSignupMode) {
    if (confirmGroup) confirmGroup.style.display = 'block';
    if (loginBtn) loginBtn.textContent = getString('login.signup');
    if (signupBtn) signupBtn.textContent = getString('login.back_to_login');
  } else {
    if (confirmGroup) confirmGroup.style.display = 'none';
    if (loginBtn) loginBtn.textContent = getString('login.login');
    if (signupBtn) signupBtn.textContent = getString('login.signup');
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

  const supabaseAvailable = !!(window.supabase && window.SUPABASE_URL);

  if (app.isSignupMode) {
    // Handle signup
    const passwordConfirm = document.getElementById('password-confirm').value;

    if (password !== passwordConfirm) {
      showFieldError('confirm', getString('login.passwords_dont_match'));
      return;
    }

    if (supabaseAvailable) {
      try {
        const { data: signUpData, error: signUpError } = await window.supabase.auth.signUp({ email, password });
        if (signUpError) {
          showGeneralMessage(signUpError.message);
          return;
        }

        // Create minimal profile row
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .insert([{ email, full_name: '' }])
          .select()
          .single();

        if (profileError) {
          showGeneralMessage(profileError.message);
          return;
        }

        showGeneralMessage(getString('login.account_created'));
        setTimeout(() => {
          app.isSignupMode = false;
          toggleSignupMode();
        }, 1200);
        return;
      } catch (err) {
        showGeneralMessage(err.message || getString('login.signup_error'));
        return;
      }
    }

    // Fallback: localStorage signup
    if (app.users[email]) {
      showFieldError('email', getString('login.email_already_registered'));
      return;
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
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showGeneralMessage(error.message || getString('login.invalid_credentials'));
          return;
        }

        if (rememberMe) {
          localStorage.setItem('rememberedUser', `${email}:${password}`);
        } else {
          localStorage.removeItem('rememberedUser');
        }

        loadView('home');
        return;
      } catch (err) {
        showGeneralMessage(err.message || getString('login.login_failed'));
        return;
      }
    }

    // Fallback: localStorage login
    if (app.users[email] === `${email}:${password}`) {
      if (rememberMe) {
        localStorage.setItem('rememberedUser', `${email}:${password}`);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      loadView('home');
    } else {
      showGeneralMessage(getString('login.invalid_credentials'));
    }
  }
}
