// Global state
const app = {
  currentView: null,
  isSignupMode: false,
  users: JSON.parse(localStorage.getItem('users')) || {
    'admin@example.com': 'admin@example.com:1234' // stored as email:password
  }
};

// Check if user is remembered
function checkRememberedUser() {
  const remembered = localStorage.getItem('rememberedUser');
  if (remembered) {
    const [email, password] = remembered.split(':');
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    document.getElementById('remember-me').checked = true;
  }
}

// Small UI indicator helper: sets the status pill in the login card
function setSupabaseIndicator(online) {
  const el = document.getElementById('supabase-indicator');
  if (!el) return;
  if (online) {
    el.textContent = 'Supabase: Connected';
    el.classList.remove('offline');
    el.classList.add('online');
  } else {
    el.textContent = 'Supabase: Offline';
    el.classList.remove('online');
    el.classList.add('offline');
  }
}

// Initialize Supabase client loader: this will load `supabase_client.js`
// which attaches a client to `window.supabase` if `config.js` (or runtime keys)
// are present. We keep this optional so localStorage fallback still works.
function initSupabase() {
  try {
    // If no runtime keys, show offline and skip loading client
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      setSupabaseIndicator(false);
      return;
    }

    // show offline initially while we wait for the client to load
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

    // Poll for the client to appear (short-lived)
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

function loadView(viewName) {
  if (viewName === 'login') {
    // Load login directly into body, not #app, so it bypasses #app constraints
    fetch(`${viewName}.html`)
      .then(res => res.text())
      .then(html => {
        document.body.innerHTML = html;
        app.currentView = viewName;
        initLogin();
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

// Login initialization and handler
function initLogin() {
  // Position login card 2/3 from top
  const loginPage = document.getElementById('login-page');
  if (loginPage) {
    loginPage.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 66.66vh;
      z-index: 10000;
      background: linear-gradient(135deg, #f4f6f8 0%, #ffffff 100%);
      box-sizing: border-box;
      margin: 0;
      border: none;
      transform: translateY(-50%);
    `;
  }
  
  // Wire up buttons
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  const toggleBtn = document.getElementById('toggle-mode');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSignupMode);
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

  // Initialize Supabase indicator/client when the login view loads
  initSupabase();
}

function togglePasswordVisibility(fieldId) {
  const input = document.getElementById(fieldId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
}

function toggleSignupMode() {
  app.isSignupMode = !app.isSignupMode;
  const passwordConfirmLabel = document.getElementById('signup-confirm-label');
  const passwordConfirmWrapper = document.getElementById('confirm-wrapper');
  const loginBtn = document.getElementById('login-btn');
  const toggleBtn = document.getElementById('toggle-mode');

  if (app.isSignupMode) {
    passwordConfirmLabel.style.display = 'block';
    passwordConfirmWrapper.style.display = 'flex';
    loginBtn.textContent = 'Sign Up';
    toggleBtn.textContent = 'Back to Sign In';
  } else {
    passwordConfirmLabel.style.display = 'none';
    passwordConfirmWrapper.style.display = 'none';
    loginBtn.textContent = 'Sign In';
    toggleBtn.textContent = 'Sign Up';
  }
  clearAllErrors();
}

function isValidEmail(email) {
  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showFieldError(field, message) {
  const errorEl = document.getElementById(`${field}-error`);
  const inputEl = document.getElementById(field === 'confirm' ? 'password-confirm' : field);
  
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  if (inputEl) {
    inputEl.classList.add('error');
  }
}

function showGeneralMessage(message, type = 'error') {
  const generalError = document.getElementById('general-error');
  generalError.textContent = message;
  generalError.style.display = 'block';
  
  if (type === 'success') {
    generalError.style.backgroundColor = '#efe';
    generalError.style.color = '#3c3';
    generalError.style.borderLeftColor = '#3c3';
  } else {
    generalError.style.backgroundColor = '#fee';
    generalError.style.color = '#c33';
    generalError.style.borderLeftColor = '#c33';
  }
}

function clearAllErrors() {
  document.getElementById('email-error').style.display = 'none';
  document.getElementById('password-error').style.display = 'none';
  document.getElementById('confirm-error').style.display = 'none';
  document.getElementById('general-error').style.display = 'none';
  
  document.getElementById('email').classList.remove('error');
  document.getElementById('password').classList.remove('error');
  document.getElementById('password-confirm').classList.remove('error');
}

// Home initialization
function initHome() {
  // Any post-login logic here
  console.log('Home view initialized');
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  clearAllErrors();

  if (!email || !password) {
    if (!email) showFieldError('email', 'Email is required');
    if (!password) showFieldError('password', 'Password is required');
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    showFieldError('email', 'Please enter a valid email address');
    return;
  }

  const supabaseAvailable = !!(window.supabase && window.SUPABASE_URL);

  if (app.isSignupMode) {
    // Handle signup
    const passwordConfirm = document.getElementById('password-confirm').value;

    if (password !== passwordConfirm) {
      showFieldError('confirm', 'Passwords do not match');
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

        showGeneralMessage('Account created! Please sign in.', 'success');
        setTimeout(() => {
          app.isSignupMode = true;
          toggleSignupMode();
        }, 1200);
        return;
      } catch (err) {
        showGeneralMessage(err.message || 'Signup failed');
        return;
      }
    }

    // Fallback: localStorage signup
    if (app.users[email]) {
      showFieldError('email', 'Email already registered');
      return;
    }

    app.users[email] = `${email}:${password}`;
    localStorage.setItem('users', JSON.stringify(app.users));
    showGeneralMessage('Account created! Please sign in.', 'success');
    setTimeout(() => {
      app.isSignupMode = true;
      toggleSignupMode();
    }, 1500);
  } else {
    // Handle login
    if (supabaseAvailable) {
      try {
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showGeneralMessage(error.message || 'Invalid email or password');
          return;
        }

        // Optionally persist remembered user for UI convenience
        if (rememberMe) {
          localStorage.setItem('rememberedUser', `${email}:${password}`);
        } else {
          localStorage.removeItem('rememberedUser');
        }

        loadView('home');
        return;
      } catch (err) {
        showGeneralMessage(err.message || 'Login failed');
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
      showGeneralMessage('Invalid email or password');
    }
  }
}
