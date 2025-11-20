/**
 * onboarding_init.js
 * Handles onboarding modal initialization and form submission
 */

async function initializeOnboarding() {
  try {
    // Ensure strings are loaded first
    await loadStrings();
    
    // Fetch onboarding HTML
    const response = await fetch('onboarding/onboarding.html');
    if (!response.ok) throw new Error('Failed to load onboarding.html');
    
    const html = await response.text();
    
    // Create wrapper div and append to body (not to container)
    // This allows fixed positioning to work properly
    const wrapper = document.createElement('div');
    wrapper.id = 'onboarding-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    
    // Load onboarding styles if not already loaded
    if (!document.querySelector('link[href="onboarding/onboarding_styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'onboarding/onboarding_styles.css';
      document.head.appendChild(link);
    }

    // Load avatar styles if not already loaded
    if (!document.querySelector('link[href="avatar/avatar_styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'avatar/avatar_styles.css';
      document.head.appendChild(link);
    }
    
    // Load avatar HTML into the avatar section
    const avatarResponse = await fetch('avatar/avatar.html');
    if (!avatarResponse.ok) throw new Error('Failed to load avatar/avatar.html');
    const avatarHtml = await avatarResponse.text();
    
    const form = wrapper.querySelector('form');
    const avatarSection = wrapper.querySelector('#avatar-section');
    if (avatarSection) {
      avatarSection.innerHTML = avatarHtml;
    }
    
    // Set up event listeners
    setupOnboardingForm();
    
    // Translate text
    translateOnboarding();
    
    console.log('Onboarding modal initialized');
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    showOnboardingError('Failed to load onboarding form');
  }
}

function setupOnboardingForm() {
  const form = document.getElementById('onboarding-form');
  if (!form) return;
  
  form.addEventListener('submit', handleOnboardingSubmit);
  
  // Avatar upload setup using reusable module
  setupAvatarUpload('avatar-placeholder', 'avatar-file-input');
  
  // Clear errors on input
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      clearFieldError(input.id);
    });
  });
}

async function handleOnboardingSubmit(e) {
  e.preventDefault();
  
  // Validate form
  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const reportsToEmail = document.getElementById('reports-to-email').value.trim();
  
  let hasErrors = false;
  
  if (!firstName) {
    showFieldError('first-name', getString('onboarding.error.firstNameRequired'));
    hasErrors = true;
  }
  
  if (!lastName) {
    showFieldError('last-name', getString('onboarding.error.lastNameRequired'));
    hasErrors = true;
  }
  
  if (!reportsToEmail) {
    showFieldError('reports-to-email', getString('onboarding.error.reportsToEmailRequired'));
    hasErrors = true;
  } else if (!isValidEmail(reportsToEmail)) {
    showFieldError('reports-to-email', getString('onboarding.error.invalidEmail'));
    hasErrors = true;
  }
  
  if (hasErrors) return;
  
  // Disable button during save
  const submitBtn = document.getElementById('onboarding-save-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = getString('onboarding.saving');
  }
  
  try {
    // Save to Supabase
    const user = window.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    // Upload avatar if one was selected, otherwise create initials avatar
    let avatarUrl = null;
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview && avatarPreview.src && avatarPreview.style.display !== 'none') {
      try {
        avatarUrl = await uploadAvatarToSupabase(user.id);
      } catch (avatarError) {
        console.warn('Avatar upload failed, continuing with initials:', avatarError);
      }
    }
    
    // If no custom avatar, use initials
    if (!avatarUrl) {
      try {
        avatarUrl = await uploadInitialsAvatarToSupabase(user.id, firstName, lastName);
      } catch (initialsError) {
        console.warn('Initials avatar creation failed:', initialsError);
        // Continue without avatar if initials fail too
      }
    }
    
    // First, verify the row exists
    const { data: existingRow, error: checkError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (checkError) {
      throw new Error('Profile row not found. Please contact support.');
    }
    
    const { error } = await window.supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        reports_to_email: reportsToEmail,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) throw new Error(error.message);
    
    // Hide onboarding modal
    hideOnboarding();
    
    // Initialize and show home
    if (typeof initHomeContainer === 'function') {
      await initHomeContainer();
    }
    
    const homeContainer = document.getElementById('home-container');
    if (homeContainer) homeContainer.classList.add('visible');
    
    if (typeof loadView === 'function') {
      loadView('home');
    }
    
  } catch (error) {
    console.error('Error saving onboarding:', error);
    showOnboardingError(error.message || 'Error saving profile');
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = getString('onboarding.save');
    }
  }
}

function hideOnboarding() {
  const wrapper = document.getElementById('onboarding-wrapper');
  if (wrapper) {
    wrapper.remove();
  }
}

function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearFieldError(fieldId) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
}

function showOnboardingError(message) {
  const errorEl = document.getElementById('onboarding-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function translateOnboarding() {
  document.getElementById('onboarding-header').textContent = getString('onboarding.header');
  document.getElementById('first-name-label').textContent = getString('onboarding.name.firstName');
  document.getElementById('last-name-label').textContent = getString('onboarding.name.lastName');
  document.getElementById('reports-to-email-label').textContent = getString('onboarding.manager.email');
  document.getElementById('reports-to-hint').textContent = getString('onboarding.manager.hint');
  
  // Set tooltip with line breaks as HTML
  const tooltipText = getString('onboarding.manager.tooltip');
  document.getElementById('reports-to-tooltip').innerHTML = tooltipText.replace(/\n/g, '<br>');
  
  document.getElementById('onboarding-save-btn').textContent = getString('onboarding.save');
  document.getElementById('onboarding-info-text').textContent = getString('onboarding.infoText');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


