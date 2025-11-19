// ===============================
// Login Authentication Module
// ===============================
// Handles all authentication logic for signup and login flows

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
