// Profile (user menu) modal initialization - compatibility shim added
try {
  console.log('INIT: user_menu_init.js starting execution');

  // Load profile stylesheet (now under user_menu)
  const loadProfileStylesheet = async () => {
    if (window.loadStylesheetSafe) {
      await window.loadStylesheetSafe('containers/user_menu/user_menu_styles.css', 'user-menu-styles');
      return;
    }
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
    // Ensure strings are loaded before attempting to translate
    if (typeof loadStrings === 'function') {
      try { await loadStrings(); } catch (e) { console.warn('loadStrings failed in translateProfileUI', e); }
    }

    const elements = document.querySelectorAll('[data-i18n]');
    // Debug: expose current language and a sample translation
    try {
      console.log('translateProfileUI running — language:', (typeof getLanguage === 'function' ? getLanguage() : null), 'sample:', (typeof getString === 'function' ? getString('profile.editProfile') : null));
    } catch (e) { /* ignore */ }

    for (const el of elements) {
      const key = el.getAttribute('data-i18n');
      let text = null;
      if (typeof getString === 'function') {
        try { text = getString(key); } catch (e) { console.warn('getString failed for', key, e); }
      } else if (window.getString) {
        try { text = window.getString(key); } catch (e) { console.warn('window.getString failed for', key, e); }
      }
      if (text) {
        el.textContent = text;
      }
    }
  };

  // Listen globally for language changes so visible UI can re-translate
  try {
    window.addEventListener('languageChanged', async () => {
      try { await translateProfileUI(); } catch (e) { console.warn('translateProfileUI failed on languageChanged', e); }
    });
  } catch (e) {
    console.warn('Failed to attach global languageChanged listener (user_menu)', e);
  }

  // Export for manual testing from the console
  try { window.translateProfileUI = translateProfileUI; } catch (e) { /* ignore */ }

  // Modular menu system
  const profileMenuConfig = {
    edit: {
      action: 'edit',
      handler: async () => {
        // DEBUG: trace when edit handler runs
        try { console.log('DEBUG: USER_MENU edit handler invoked'); } catch(e){}
        // Close the profile dropdown locally, then open the full profile page if available.
        try { closeProfileModal(); } catch (e) { console.warn('closeProfileModal failed', e); }

        // Prefer opening the full profile page if available. If the profile
        // module hasn't attached its global yet (race on script load), poll
        // briefly before falling back to the legacy modal.
        const tryOpenProfile = async () => {
          if (typeof window.openUserProfile === 'function') {
            try { console.log('DEBUG: USER_MENU calling window.openUserProfile'); } catch(e){}
            await window.openUserProfile();
            return true;
          }
          if (window.UserProfile && typeof window.UserProfile.open === 'function') {
            try { console.log('DEBUG: USER_MENU calling window.UserProfile.open'); } catch(e){}
            await window.UserProfile.open();
            return true;
          }
          // brief polling (up to ~500ms)
          let attempts = 0;
          while (attempts < 10) {
            await new Promise(r => setTimeout(r, 50));
            if (typeof window.openUserProfile === 'function') {
              try { console.log('DEBUG: USER_MENU calling window.openUserProfile after wait'); } catch(e){}
              await window.openUserProfile();
              return true;
            }
            if (window.UserProfile && typeof window.UserProfile.open === 'function') {
              try { console.log('DEBUG: USER_MENU calling window.UserProfile.open after wait'); } catch(e){}
              await window.UserProfile.open();
              return true;
            }
            attempts++;
          }
          return false;
        };

        if (await tryOpenProfile()) return;
        try { console.log('DEBUG: USER_MENU falling back to legacy openEditProfileModal'); } catch(e){}
        await openEditProfileModal();
      }
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
    // DEBUG: list which profile buttons are present and confirm listeners
    try {
      const editBtn = document.getElementById('profile-edit-btn');
      const settingsBtn = document.getElementById('profile-settings-btn');
      const logoutBtn = document.getElementById('profile-logout-btn');
      console.log('DEBUG: USER_MENU listeners attached', { edit: !!editBtn, settings: !!settingsBtn, logout: !!logoutBtn });
    } catch(e) {}

    // Add a delegated click detector to capture clicks even if listeners fail to attach
    try {
      document.addEventListener('click', (ev) => {
        const target = ev.target;
        if (!target) return;
        const el = target.closest ? target.closest('#profile-edit-btn') : null;
        if (el) {
          try { console.log('DEBUG: USER_MENU detected click on #profile-edit-btn'); } catch(e) {}
        }
      }, true);
    } catch(e) {}
    
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
      // Re-translate when language changes elsewhere in the app
      try {
        window.addEventListener('languageChanged', async () => {
          try { await translateProfileUI(); } catch (e) { console.warn('translateProfileUI failed on languageChanged', e); }
        });
      } catch (e) {
        console.warn('Failed to attach languageChanged listener in user_menu', e);
      }
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
      // Ensure the modal HTML is present. If not, initialize it and retry once.
      let dropdown = document.getElementById('profile-dropdown');
      if (!dropdown) {
        try {
          await initProfileModal();
        } catch (e) {
          console.warn('initProfileModal failed while opening profile:', e);
        }
        dropdown = document.getElementById('profile-dropdown');
      }

      // Re-run translation for the profile dropdown in case language changed
      try {
        if (typeof translateProfileUI === 'function') await translateProfileUI();
      } catch (e) { console.warn('translateProfileUI failed during openProfileModal', e); }

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

      // Guard DOM access in case initProfileModal didn't inject expected elements
      const nameEl = document.getElementById('profile-name');
      const roleEl = document.getElementById('profile-role');
      const emailEl = document.getElementById('profile-email');

      if (nameEl) nameEl.textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
      if (roleEl) roleEl.textContent = profile.role || '';
      if (emailEl) emailEl.textContent = profile.email || '';

      displayProfileAvatar(profile.avatar_url, profile.first_name, profile.last_name);

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
