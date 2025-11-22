// Profile (user menu) modal initialization - compatibility shim added
try {
  console.log('INIT: user_menu_init.js starting execution');

  // Load profile stylesheet (now under user_menu)
  const loadProfileStylesheet = async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'containers/user_menu/user_menu_styles.css';
    document.head.appendChild(link);
  };

  // Display avatar in profile modal
  const displayProfileAvatar = (avatarUrl, firstName, lastName) => {
    const profileAvatarEl = document.getElementById('profile-avatar');
    if (!profileAvatarEl) return;
    profileAvatarEl.innerHTML = '';

    const storeImage = window.AvatarStore && typeof window.AvatarStore.getImage === 'function'
      ? window.AvatarStore.getImage()
      : null;

    if (storeImage) {
      const img = document.createElement('img');
      img.src = storeImage;
      img.alt = `${firstName || ''} ${lastName || ''}`.trim();
      profileAvatarEl.appendChild(img);
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
      closeProfileModal();

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
        if (!dropdown.contains(e.target) && !avatarBtn?.contains(e.target)) {
          closeProfileModal();
        }
      }
    }, true);
    
    window.addEventListener('resize', () => {
      closeProfileModal();
    });
  };

  // Initialize profile modal
  const initProfileModal = async () => {
    try {
      await loadProfileStylesheet();
      const response = await fetch('containers/user_menu/user_menu.html');
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

  // EXPORT TO WINDOW (provide new names plus backward-compatible aliases)
  console.log('INIT: Exporting functions to window (user_menu + compatibility)');
  window.initUserMenu = initProfileModal;
  window.openUserMenu = openProfileModal;
  window.closeUserMenu = closeProfileModal;
  window.userMenuConfig = profileMenuConfig;

  // Backwards compatibility: keep old names mapped
  window.initProfileModal = window.initUserMenu;
  window.openProfileModal = window.openUserMenu;
  window.closeProfileModal = window.closeUserMenu;
  window.profileMenuConfig = window.userMenuConfig;

  console.log('INIT: user_menu_init.js complete - functions exported');

} catch (err) {
  console.error('USER_MENU INIT ERROR:', err);
  console.error('Stack:', err.stack);
}
