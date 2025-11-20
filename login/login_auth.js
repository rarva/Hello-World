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

        // Create profile row with language preference and user ID
        console.log('Creating profile for:', email);
        const currentLang = typeof getLanguage === 'function' ? getLanguage() : 'pt';
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .insert([{ 
            id: signUpData.user.id,
            email, 
            full_name: '', 
            language: currentLang 
          }])
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
        
        // Hide login form after successful signup
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
          loginContainer.style.display = 'none';
          loginContainer.style.visibility = 'hidden';
          loginContainer.style.pointerEvents = 'none';
          loginContainer.style.zIndex = '-9999';
          loginContainer.innerHTML = '';  // Clear all content
          console.log('Login container hidden and cleared');
        }
        
        // Store current user and initialize onboarding
        window.currentUser = signUpData.user;
        if (typeof initializeOnboarding === 'function') {
          initializeOnboarding();
        } else {
          console.error('Onboarding module not loaded');
        }
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

        // Store current user
        window.currentUser = data.user;

        // Fetch user's profile data (language + mandatory fields)
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .select('language, first_name, last_name, reports_to_email')
          .eq('email', email)
          .single();
        
        if (profileData && profileData.language && typeof updateLanguageFromProfile === 'function') {
          updateLanguageFromProfile(profileData.language);
        }

        // Check if user needs to complete onboarding (missing mandatory fields)
        const needsOnboarding = !profileData?.first_name || !profileData?.last_name || !profileData?.reports_to_email;
        
        if (needsOnboarding) {
          // Hide login form before showing onboarding
          const loginContainer = document.getElementById('login-container');
          if (loginContainer) {
            loginContainer.style.display = 'none';
            loginContainer.style.visibility = 'hidden';
            loginContainer.style.pointerEvents = 'none';
            loginContainer.style.zIndex = '-9999';
            loginContainer.innerHTML = '';
            console.log('Login container hidden for onboarding');
          }
          
          // Show onboarding modal instead of home
          if (typeof initializeOnboarding === 'function') {
            initializeOnboarding();
          } else {
            console.error('Onboarding module not loaded');
            loadView('home');
          }
        } else {
          // All mandatory fields complete, proceed to home
          loadView('home');
        }
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
