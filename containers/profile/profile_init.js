// Profile modal initialization - all code wrapped in try-catch
try {
  console.log('INIT: profile_init.js starting execution');

  // Load profile stylesheet
  const loadProfileStylesheet = async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'containers/profile/profile_styles.css';
    document.head.appendChild(link);
  };

  // Helper: Get initials from name
  const getInitials = (firstName = '', lastName = '') => {
    const f = (firstName || '').charAt(0).toUpperCase();
    const l = (lastName || '').charAt(0).toUpperCase();
    return (f + l) || '?';
  };

  // Helper: Get deterministic color for initials
  const getColorForInitials = (firstName = '', lastName = '') => {
    const colors = [
      '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
      '#1ABC9C', '#E67E22', '#34495E', '#C0392B', '#16A085'
    ];
    const str = `${firstName}${lastName}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
  };

  // Display avatar in profile modal
  const displayProfileAvatar = (avatarUrl, firstName, lastName) => {
    const profileAvatarEl = document.getElementById('profile-avatar');
    if (!profileAvatarEl) return;
    profileAvatarEl.innerHTML = '';
    if (avatarUrl) {
      const img = document.createElement('img');
      img.src = avatarUrl;
      img.alt = `${firstName} ${lastName}`;
      profileAvatarEl.appendChild(img);
    } else {
      const initials = getInitials(firstName, lastName);
      const color = initials === '?' ? '#EB8318' : getColorForInitials(firstName, lastName);
      profileAvatarEl.textContent = initials;
      profileAvatarEl.style.backgroundColor = color;
    }
  };

  // Close profile modal
  const closeProfileModal = () => {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
      dropdown.classList.remove('visible');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      if (window.handleLogout) {
        await window.handleLogout();
      }
    } catch (error) {
      if (window.showProfileGeneralError) {
        window.showProfileGeneralError(`Logout failed: ${error.message}`);
      }
    }
  };

  // Open edit profile modal
  const openEditProfileModal = async () => {
    closeProfileModal();
    if (window.initEditProfileModal) {
      await window.initEditProfileModal();
    }
  };

  // Translate profile UI text
  const translateProfileUI = async () => {
    const elements = document.querySelectorAll('[data-i18n]');
    for (const el of elements) {
      const key = el.getAttribute('data-i18n');
      const text = window.getString ? window.getString(key) : null;
      if (text) {
        el.textContent = text;
      }
    }
  };

  // Modular menu system
  const profileMenuConfig = {
    edit: {
      action: 'edit',
      handler: async () => { await openEditProfileModal(); }
    },
    settings: {
      action: 'settings',
      handler: async () => { console.log('Settings clicked'); }
    },
    logout: {
      action: 'logout',
      handler: async () => { await handleLogout(); }
    }
  };

  // Setup event listeners
  const setupProfileEventListeners = () => {
    const closeBtn = document.getElementById('profile-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeProfileModal);
    }
    Object.entries(profileMenuConfig).forEach(([key, config]) => {
      const btn = document.getElementById(`profile-${key}-btn`);
      if (btn) {
        btn.addEventListener('click', config.handler);
      }
    });
    
    // Close dropdown on any click outside it
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('profile-dropdown');
      const avatarBtn = document.getElementById('toolbar-avatar-btn');
      if (dropdown && dropdown.classList.contains('visible')) {
        // Close if click is outside both dropdown and avatar button
        if (!dropdown.contains(e.target) && !avatarBtn?.contains(e.target)) {
          closeProfileModal();
        }
      }
    }, true); // Use capture phase to catch all clicks
    
    // Close dropdown when window is resized
    window.addEventListener('resize', () => {
      closeProfileModal();
    });
  };

  // Initialize profile modal
  const initProfileModal = async () => {
    try {
      await loadProfileStylesheet();
      const response = await fetch('containers/profile/profile.html');
      const html = await response.text();
      document.body.insertAdjacentHTML('beforeend', html);
      setupProfileEventListeners();
      await translateProfileUI();
    } catch (error) {
      console.error('Failed to initialize profile modal:', error);
      if (window.showProfileGeneralError) {
        window.showProfileGeneralError(`Failed to initialize profile modal: ${error.message}`);
      }
    }
  };

  // Open profile modal and populate with user data
  const openProfileModal = async () => {
    try {
      const user = window.currentUser;
      if (!user) {
        console.error('No current user found');
        return;
      }
      const { data: profile, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      
      document.getElementById('profile-name').textContent = 
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
      document.getElementById('profile-role').textContent = profile.role || '';
      document.getElementById('profile-email').textContent = profile.email || '';
      displayProfileAvatar(profile.avatar_url, profile.first_name, profile.last_name);
      
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) {
        dropdown.classList.add('visible');
      }
    } catch (error) {
      console.error('Error opening profile:', error);
      if (window.showProfileGeneralError) {
        window.showProfileGeneralError(`Failed to open profile: ${error.message}`);
      }
    }
  };

  // EXPORT TO WINDOW
  console.log('INIT: Exporting functions to window');
  window.initProfileModal = initProfileModal;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.profileMenuConfig = profileMenuConfig;
  console.log('INIT: profile_init.js complete - functions exported');

} catch (err) {
  console.error('PROFILE INIT ERROR:', err);
  console.error('Stack:', err.stack);
}
