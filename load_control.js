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

function handleLogin() {
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

  if (app.isSignupMode) {
    // Handle signup
    const passwordConfirm = document.getElementById('password-confirm').value;
    
    if (password !== passwordConfirm) {
      showFieldError('confirm', 'Passwords do not match');
      return;
    }

    if (app.users[email]) {
      showFieldError('email', 'Email already registered');
      return;
    }

    // Register new user
    app.users[email] = `${email}:${password}`;
    localStorage.setItem('users', JSON.stringify(app.users));
    showGeneralMessage('Account created! Please sign in.', 'success');
    
    // Switch back to login mode
    setTimeout(() => {
      app.isSignupMode = true;
      toggleSignupMode();
    }, 1500);
  } else {
    // Handle login
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

// Start with login view
loadView('login');
