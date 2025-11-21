// ===============================
// Toolbar Module
// ===============================
// Handles toolbar initialization, navigation, container loading, and user avatar display

/**
 * Initialize toolbar container: load HTML and styles
 */
function initToolbarContainer() {
  fetch('containers/toolbar/toolbar.html')
    .then(res => res.text())
    .then(html => {
      const toolbarContainer = document.getElementById('toolbar-container');
      toolbarContainer.innerHTML = html;
      
      // Load toolbar styles
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'containers/toolbar/toolbar_styles.css';
      document.head.appendChild(style);
      
      // Initialize toolbar after HTML is present
      initToolbar();
    })
    .catch(err => {
      showToolbarError('Failed to load toolbar');
      console.error('Failed to load toolbar:', err);
    });
}

/**
 * Initialize toolbar after HTML is loaded
 */
function initToolbar() {
  // Load strings and initialize toolbar
  if (typeof loadStrings === 'function') {
    loadStrings().then(() => {
      renderToolbar();
      setupAvatarButton();
    }).catch(error => {
      showToolbarError('Toolbar error');
      console.error('Toolbar load error:', error);
    });
  } else {
    renderToolbar();
    setupAvatarButton();
  }
}

/**
 * Render toolbar content
 */
function renderToolbar() {
  const container = document.getElementById('toolbar-links');
  
  if (!container) return;

  container.innerHTML = '';

  // Create navigation links for each toolbar item
  const toolbarKeys = ['home', 'about', 'contact'];
  toolbarKeys.forEach(key => {
    const toolbarKey = `toolbar.${key}`;
    const text = typeof getString === 'function' ? getString(toolbarKey) : key;
    if (text) {
      const a = document.createElement('a');
      a.href = key + '.html';
      a.textContent = text;
      container.appendChild(a);
    }
  });

  // Add train SVG inline for full CSS control
  const trainContainer = document.querySelector('.toolbar-train');
  if (trainContainer) {
    trainContainer.innerHTML = `
      <svg class="inline-train-svg" viewBox="0 0 557 281" xmlns="http://www.w3.org/2000/svg" width="557" height="281">
        <g id="Background">
          <g>
            <path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M360,66c6,1,13,7,19,11c16,12,39,27,54,44v3c-2,1-4,1-6,1
              c-3,0-50-11-73-18c-7-2-13-4-18-8c-8-5-15-12-22-18c-2-1-14-11-14-15c0-6,11-4,13-4C316,62,345,62,360,66z M99,0l67,11h34
              c88,5,178,37,269,127c7,8,20,10,30,15c16,9,47,28,54,49c2,6,4,17,4,20c0,24-17,45-48,55c-5,1-14,4-17,4H7H0V0h9H99z"/>
            <line fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" x1="0" y1="281" x2="9" y2="281"/>
          </g>
        </g>
        <g id="Layer_1"></g>
      </svg>
    `;
  }
}

/**
 * Setup avatar button and profile modal trigger
 */
function setupAvatarButton() {
  const avatarBtn = document.getElementById('toolbar-avatar-btn');
  if (!avatarBtn) {
    console.error('Avatar button not found');
    return;
  }

  console.log('Setting up avatar button');

  // Wait for profile modal functions to be available
  const waitForProfileModule = async () => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait (50 * 100ms)
    
    while (attempts < maxAttempts) {
      if (typeof window.initProfileModal === 'function' && typeof window.openProfileModal === 'function') {
        console.log('Profile module found, initializing...');
        try {
          await window.initProfileModal();
          console.log('Profile modal initialized successfully');
          return true;
        } catch (err) {
          console.error('Failed to initialize profile modal:', err);
          return false;
        }
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('Profile module timeout - functions not available');
    return false;
  };

  // Initialize profile modal (wait for it to be available)
  waitForProfileModule();

  // Display user avatar
  displayToolbarAvatar();

  // Add click event to open profile modal
  avatarBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Avatar button clicked');
    if (typeof window.openProfileModal === 'function') {
      console.log('Calling window.openProfileModal()');
      try {
        await window.openProfileModal();
      } catch (err) {
        console.error('Error opening profile modal:', err);
      }
    } else {
      console.warn('window.openProfileModal is not yet available');
    }
  });
}

/**
 * Display user avatar in toolbar
 */
function displayToolbarAvatar() {
  try {
    // Wait for currentUser to be available
    const waitForUser = async () => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (attempts < maxAttempts) {
        if (window.currentUser) {
          const user = window.currentUser;
          
          // Get user profile data
          const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('avatar_url, first_name, last_name')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Failed to load profile for avatar:', error);
            return;
          }

          const avatarEl = document.getElementById('toolbar-avatar');
          if (!avatarEl) return;

          avatarEl.innerHTML = '';

          if (profile?.avatar_url) {
            const img = document.createElement('img');
            img.src = profile.avatar_url;
            img.alt = `${profile.first_name} ${profile.last_name}`;
            avatarEl.appendChild(img);
          } else {
            // Show question mark fallback
            avatarEl.textContent = '?';
            // Keep default orange background
          }
          return;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // If not found after initial attempts, check periodically
      const checkInterval = setInterval(async () => {
        if (window.currentUser) {
          clearInterval(checkInterval);
          // Recursively call to load avatar
          displayToolbarAvatar();
        }
      }, 1000); // Check every 1 second
    };
    
    waitForUser();
  } catch (error) {
    console.error('Error displaying toolbar avatar:', error);
  }
}

// Listen for the avatarUpdated event
function initializeToolbar() {
    // ...existing toolbar initialization code...

    document.addEventListener('avatarUpdated', (event) => {
        const { avatarUrl } = event.detail;
        const avatarElement = document.getElementById('toolbar-avatar'); // Replace with the actual selector
        if (avatarElement) {
            avatarElement.src = avatarUrl; // Update the avatar image source
        }

        // Optionally, refresh the toolbar avatar display logic
        displayToolbarAvatar();
    });
}

initializeToolbar();

/**
 * Helper: Get initials from name
 */
function getInitialsToolbar(firstName = '', lastName = '') {
  const f = (firstName || '').charAt(0).toUpperCase();
  const l = (lastName || '').charAt(0).toUpperCase();
  return (f + l) || '?';
}

/**
 * Helper: Get deterministic color for initials
 */
function getColorForInitialsToolbar(firstName = '', lastName = '') {
  const colors = [
  '#e53e38',       /* Red */
  '#ff8e1d',       /* Orange */
  '#FFD93D',       /* Yellow */
  '#9ACD32',       /* Green */
  '#4D96FF',       /* Blue */
  '#7B68EE',       /* Purple */
  '#FF6B9D',       /* Pink */
  '#bb713c',       /* Brown */
  '#00D9FF',       /* Cyan */
  '#379787',      /* Esmerald */
  ];
  const str = `${firstName}${lastName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
}
