/**
 * onboarding_init.js
 * Handles onboarding modal initialization and form submission
 */

/**
 * Load a CSS stylesheet dynamically if it is not already present in the document.
 * @param {string} href - The URL of the stylesheet to load.
 */
function loadStylesheet(href) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

/**
 * Initialize the onboarding modal by loading required resources, setting up the form, and translating text.
 */
async function initializeOnboarding() {
  try {
    await loadStrings(); // Ensure strings are loaded first
    await loadOnboardingHTML(); // Load and append onboarding HTML
    await loadOnboardingStyles(); // Load required stylesheets (wait to avoid FOUC)
    await loadAvatarSection(); // Load avatar section HTML
    setupOnboardingForm(); // Set up form event listeners
    translateOnboarding(); // Translate onboarding modal

    console.log('Onboarding modal initialized');
  } catch (error) {
     console.error('Error initializing onboarding:', error);
     if (typeof getString === 'function') window.showOnboardingError?.(getString('onboarding.load_failed'));
     else window.showOnboardingError?.('Failed to load onboarding form');
  }
}

/**
 * Fetch and append the onboarding HTML to the document.
 */
async function loadOnboardingHTML() {
  const response = await fetch('containers/onboarding/onboarding.html');
  if (!response.ok) throw new Error('Failed to load onboarding.html');

  const html = await response.text();
  const wrapper = document.createElement('div');
  wrapper.id = 'onboarding-wrapper';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
}

/**
 * Load the required stylesheets for the onboarding modal.
 */
function loadOnboardingStyles() {
  // Use safe loader to avoid FOUC; return a Promise that resolves when both styles have loaded
  if (window.loadStylesheetSafe) {
    return Promise.all([
      window.loadStylesheetSafe('containers/onboarding/onboarding_styles.css', 'onboarding-styles'),
      window.loadStylesheetSafe('global/avatar/avatar_styles.css', 'avatar-styles')
    ]);
  }
  loadStylesheet('containers/onboarding/onboarding_styles.css');
  loadStylesheet('global/avatar/avatar_styles.css');
  return Promise.resolve();
}

/**
 * Fetch and load the avatar section HTML into the onboarding modal.
 */
async function loadAvatarSection() {
  const avatarResponse = await fetch('global/avatar/avatar.html');
  if (!avatarResponse.ok) throw new Error('Failed to load global/avatar/avatar.html');

  const avatarHtml = await avatarResponse.text();
  const avatarSection = document.querySelector('#onboarding-wrapper #avatar-section');
  if (avatarSection) {
    avatarSection.innerHTML = avatarHtml;

    // Clear any existing avatar preview for the onboarding instance so the
    // placeholder is shown empty when onboarding opens. This avoids leaking a
    // previously-uploaded preview into the onboarding flow.
    try {
      const avatarPlaceholder = avatarSection.querySelector('#avatar-placeholder');
      if (avatarPlaceholder) {
        const avatarPreview = avatarPlaceholder.querySelector('#avatar-preview');
        if (avatarPreview) {
          avatarPreview.src = '';
          avatarPreview.style.display = 'none';
        }
        const placeholderSvg = avatarPlaceholder.querySelector('svg');
        if (placeholderSvg) {
          placeholderSvg.style.display = '';
        }
      }
      // Also clear any in-memory preview stored in AvatarStore so onboarding
      // starts with a clean state (matches a full page refresh behavior).
      if (window && window.AvatarStore && typeof window.AvatarStore.setPreview === 'function') {
        try {
          window.AvatarStore.setPreview(null);
        } catch (err) {
          console.warn('Failed to clear AvatarStore preview for onboarding', err);
        }
      }
      // Also clear toolbar avatar DOM immediately so the toolbar doesn't
      // display the previous user's avatar while onboarding is open.
      try {
        const toolbarAvatarEl = document.getElementById('toolbar-avatar');
        if (toolbarAvatarEl) {
          // Remove any existing image
          const existingImg = toolbarAvatarEl.querySelector('img');
          if (existingImg) existingImg.remove();

          // Show placeholder text if translations available
          if (typeof getString === 'function') {
            toolbarAvatarEl.textContent = '';
          } else {
            toolbarAvatarEl.textContent = '';
          }
          // Apply placeholder styling consistent with syncToolbarAvatar
          toolbarAvatarEl.style.backgroundColor = 'var(--color-primary)';
          toolbarAvatarEl.style.color = 'var(--font-color-light)';
        }
      } catch (err) {
        console.warn('Failed to clear toolbar avatar DOM for onboarding', err);
      }
    } catch (err) {
      // Best-effort: do not block onboarding if clearing fails
      console.warn('Failed to reset onboarding avatar preview', err);
    }
  }
}

/**
 * Set up the onboarding form by adding event listeners for submission and input error clearing.
 */
function setupOnboardingForm() {
  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', handleOnboardingSubmit);
  setupAvatarUpload('avatar-placeholder', 'avatar-file-input');
  setupInputErrorClearing(form);
}

/**
 * Add focus event listeners to clear errors on input fields in the form.
 * @param {HTMLFormElement} form - The onboarding form element.
 */
function setupInputErrorClearing(form) {
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => window.clearFieldError?.(input.id));
  });
}

/**
 * Validate the onboarding form fields and display errors if validation fails.
 * @returns {boolean} - True if the form is valid, false otherwise.
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

/**
 * Validate the form and prepare the data for submission.
 * @returns {Object|null} - Returns the prepared data or null if validation fails.
 */
function validateAndPrepareFormData() {
  if (!validateOnboardingForm()) return null;

  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const reportsToEmail = document.getElementById('reports-to-email').value.trim();

  return { firstName, lastName, reportsToEmail };
}

/**
 * Upload the avatar or generate initials if no avatar is uploaded.
 * @param {Object} user - The current user object.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @returns {Promise<string>} - The URL of the uploaded or generated avatar.
 */
async function handleAvatarUpload(user, firstName, lastName) {
  const avatarPreview = document.getElementById('avatar-preview');

  if (avatarPreview?.src && avatarPreview.style.display !== 'none') {
    try {
      return await uploadAvatarToSupabase(user.id);
    } catch (avatarError) {
      console.warn('Avatar upload failed, continuing with initials:', avatarError);
    }
  }

  // Generate initials avatar if no custom avatar
  const initialsDataUrl = createInitialsAvatar(firstName, lastName);
  avatarPreview.src = initialsDataUrl;
  avatarPreview.style.display = '';
  return await uploadInitialsAvatarToSupabase(user.id, firstName, lastName);
}

/**
 * Update the user's profile in the database.
 * @param {Object} user - The current user object.
 * @param {Object} profileData - The profile data to update.
 * @returns {Promise<void>} - Resolves if the update is successful.
 */
async function updateUserProfile(user, profileData) {
  const { data: existingRow, error: checkError } = await window.supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (checkError) {
    throw new Error('Profile row not found. Please contact support.');
  }

  const { error } = await window.supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}
 

function syncToolbarAvatar(avatarUrl, firstName, lastName) {
  const toolbarAvatar = document.getElementById('toolbar-avatar');
  if (!toolbarAvatar) return;

  const applyAvatar = (url) => {
    toolbarAvatar.innerHTML = '';
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = `${firstName || ''} ${lastName || ''}`.trim();
      toolbarAvatar.appendChild(img);
      toolbarAvatar.style.backgroundColor = '';
      toolbarAvatar.style.color = '';
    } else {
      if (typeof getString === 'function') {
        toolbarAvatar.textContent = '';
      } else {
        toolbarAvatar.textContent = '';
      }
      toolbarAvatar.style.backgroundColor = 'var(--color-primary)';
      toolbarAvatar.style.color = 'var(--font-color-light)';
    }
  };

  // Prefer explicit avatarUrl if provided
  if (avatarUrl && window.AvatarStore && typeof window.AvatarStore.setImage === 'function') {
    try { window.AvatarStore.setImage(avatarUrl); } catch (e) { /* ignore */ }
    applyAvatar(avatarUrl);
  } else {
    // Fallback to AvatarStore if available
    const storeImage = window.AvatarStore && typeof window.AvatarStore.getImage === 'function'
      ? window.AvatarStore.getImage()
      : null;
    applyAvatar(storeImage);
  }

  // Subscribe to store updates once per toolbar element so avatar stays in sync
  if (!toolbarAvatar.__avatarListener) {
    toolbarAvatar.__avatarListener = (e) => {
      const url = e && e.detail ? e.detail.avatarUrl : null;
      applyAvatar(url);
    };
    window.addEventListener('avatarUpdated', toolbarAvatar.__avatarListener);
  }
}

/**
 * Finalize the onboarding process by hiding the modal and showing the home view.
 */
async function finalizeOnboarding() {
  hideOnboarding();

  if (typeof initHomeContainer === 'function') {
    await initHomeContainer();
  }

  const homeContainer = document.getElementById('home-container');
  if (homeContainer) homeContainer.classList.add('visible');

  if (typeof loadView === 'function') {
    loadView('home');
  }
}

/**
 * Handle the onboarding form submission, validate inputs, upload avatar, and update the user profile.
 * @param {Event} e - The form submission event.
 */
async function handleOnboardingSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('onboarding-save-btn');
  if (!submitBtn) return;

  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = getString('onboarding.saving');

  try {
    const user = window.currentUser;
    if (!user) throw new Error('User not authenticated');

    const formData = validateAndPrepareFormData();
    if (!formData) return;

    const avatarUrl = await handleAvatarUpload(user, formData.firstName, formData.lastName);

    // Populate global AvatarStore so other modules can use the avatar immediately
    if (window.AvatarStore && typeof window.AvatarStore.setImage === 'function') {
      try { window.AvatarStore.setImage(avatarUrl); } catch (e) { /* ignore */ }
    }

    await updateUserProfile(user, {
      first_name: formData.firstName,
      last_name: formData.lastName,
      reports_to_email: formData.reportsToEmail,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    syncToolbarAvatar(avatarUrl, formData.firstName, formData.lastName);
    // Notify manager about new user (best-effort, non-blocking)
    try {
      if (formData.reportsToEmail && window.emailClient && typeof window.emailClient.sendManagerNotification === 'function') {
        (async () => {
          const templateData = {
            managerName: '',
            reportName: `${formData.firstName} ${formData.lastName}`,
            company: window.APP_COMPANY_NAME || 'Rhomberg',
            userEmail: user.email
          };

          // Try to fetch the local HTML template and perform simple placeholder replacement.
          // Fallback to a minimal HTML body if the template cannot be loaded.
          let html = null;
          try {
            const tplRes = await fetch('EMAILS/templates/manager_notification.html');
            if (tplRes.ok) {
              let tpl = await tplRes.text();
              html = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => (templateData[key] != null ? templateData[key] : ''));
            }
          } catch (e) {
            // ignore and fallback
          }
          if (!html) {
            html = `<div><strong>${templateData.reportName}</strong> has been added as a direct report to ${templateData.company}.</div>`;
          }

          window.emailClient.sendManagerNotification({
            recipient_email: formData.reportsToEmail,
            subject: (typeof getString === 'function') ? getString('emails.manager_notification.subject') : 'You have a new report',
            html,
            templateData // keep for potential future use on server
          }).then(res => {
            console.log('manager notification queued:', res && (res.ok || res.status) ? res : 'unknown');
          }).catch(err => {
            console.warn('manager notification failed (non-blocking):', err);
          });
        })();
      }
    } catch (e) { /* non-fatal */ }

    await finalizeOnboarding();
  } catch (error) {
    console.error('Error saving onboarding:', error);
    window.showOnboardingError?.(error.message || 'Error saving profile');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Remove the onboarding modal from the DOM.
 */
function hideOnboarding() {
  document.getElementById('onboarding-wrapper')?.remove();
}

/**
 * Translate the onboarding modal text using language strings.
 */
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
