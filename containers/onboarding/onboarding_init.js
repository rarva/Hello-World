/**
 * onboarding_init.js
 * Handles onboarding modal initialization and form submission
 */

/**
 * Load stylesheet if not already present
 */
function loadStylesheet(href) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

async function initializeOnboarding() {
  try {
    // Ensure strings are loaded first
    await loadStrings();
    
    // Fetch onboarding HTML
    const response = await fetch('containers/onboarding/onboarding.html');
    if (!response.ok) throw new Error('Failed to load onboarding.html');
    
    const html = await response.text();
    
    // Create wrapper div and append to body (not to container)
    // This allows fixed positioning to work properly
    const wrapper = document.createElement('div');
    wrapper.id = 'onboarding-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    
    // Load stylesheets
    loadStylesheet('containers/onboarding/onboarding_styles.css');
    loadStylesheet('global/avatar/avatar_styles.css');
    
    // Load avatar HTML into the avatar section
    const avatarResponse = await fetch('global/avatar/avatar.html');
    if (!avatarResponse.ok) throw new Error('Failed to load global/avatar/avatar.html');
    const avatarHtml = await avatarResponse.text();
    
    const avatarSection = wrapper.querySelector('#avatar-section');
    if (avatarSection) {
      avatarSection.innerHTML = avatarHtml;
    }
    
    // Set up event listeners and translate
    setupOnboardingForm();
    translateOnboarding();
    
    console.log('Onboarding modal initialized');
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    window.showOnboardingError?.('Failed to load onboarding form');
  }
}

function setupOnboardingForm() {
  const form = document.getElementById('onboarding-form');
  if (!form) return;
  
  form.addEventListener('submit', handleOnboardingSubmit);
  setupAvatarUpload('avatar-placeholder', 'avatar-file-input');
  setupInputErrorClearing(form);
}

/**
 * Set up focus event listeners to clear errors on input
 */
function setupInputErrorClearing(form) {
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => window.clearFieldError?.(input.id));
  });
}

/**
 * Validate onboarding form fields
 */
function validateOnboardingForm() {
  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const reportsToEmail = document.getElementById('reports-to-email').value.trim();
  
  const errors = [];
  
  if (!firstName) {
    errors.push({ field: 'first-name', message: getString('onboarding.error.firstNameRequired') });
  }
  if (!lastName) {
    errors.push({ field: 'last-name', message: getString('onboarding.error.lastNameRequired') });
  }
  if (!reportsToEmail) {
    errors.push({ field: 'reports-to-email', message: getString('onboarding.error.reportsToEmailRequired') });
  } else if (!isValidEmail(reportsToEmail)) {
    errors.push({ field: 'reports-to-email', message: getString('onboarding.error.invalidEmail') });
  }
  
  // Display all errors
  errors.forEach(({ field, message }) => window.showFieldError?.(field, message));
  
  return errors.length === 0;
}

async function handleOnboardingSubmit(e) {
  e.preventDefault();
  
  if (!validateOnboardingForm()) return;
  
  const submitBtn = document.getElementById('onboarding-save-btn');
  if (!submitBtn) return;
  
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = getString('onboarding.saving');
  
  try {
    const user = window.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const reportsToEmail = document.getElementById('reports-to-email').value.trim();
    
    // Upload avatar if one was selected, otherwise create initials avatar
    let avatarUrl = null;
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview?.src && avatarPreview.style.display !== 'none') {
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
      }
    }
    
    // Verify profile row exists before updating
    const { data: existingRow, error: checkError } = await window.supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (checkError) {
      throw new Error('Profile row not found. Please contact support.');
    }
    
    // Update profile
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
    
    // Hide onboarding and show home
    hideOnboarding();
    
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
    window.showOnboardingError?.(error.message || 'Error saving profile');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function hideOnboarding() {
  document.getElementById('onboarding-wrapper')?.remove();
}

function translateOnboarding() {
  const translations = {
    'onboarding-header': 'onboarding.header',
    'first-name-label': 'onboarding.name.firstName',
    'last-name-label': 'onboarding.name.lastName',
    'reports-to-email-label': 'onboarding.manager.email',
    'reports-to-hint': 'onboarding.manager.hint',
    'onboarding-save-btn': 'onboarding.save',
    'onboarding-info-text': 'onboarding.infoText'
  };
  
  Object.entries(translations).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = getString(key);
  });
  
  // Set tooltip with line breaks as HTML
  const tooltip = document.getElementById('reports-to-tooltip');
  if (tooltip) {
    tooltip.innerHTML = getString('onboarding.manager.tooltip').replace(/\n/g, '<br>');
  }
}
