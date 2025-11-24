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
    .then(async html => {
      const toolbarContainer = document.getElementById('toolbar-container');
      toolbarContainer.innerHTML = html;
      
      // Load toolbar styles (wait for them to avoid FOUC)
      try {
        if (window.loadStylesheetSafe) await window.loadStylesheetSafe('containers/toolbar/toolbar_styles.css', 'toolbar-styles');
        else {
          const style = document.createElement('link');
          style.rel = 'stylesheet';
          style.href = 'containers/toolbar/toolbar_styles.css';
          document.head.appendChild(style);
        }
      } catch (e) {
        console.warn('Toolbar stylesheet failed to load safely', e);
      }

      // Initialize toolbar after HTML and styles are present
      initToolbar();
    })
    .catch(err => {
      if (typeof getString === 'function') showToolbarError(getString('toolbar.load_failed'));
      else showToolbarError('Failed to load toolbar');
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

  // Re-render toolbar when language changes elsewhere in the app
  try {
    window.addEventListener('languageChanged', () => {
      try {
        // Re-run render to pick up new translations via getString()
        renderToolbar();
        // Re-ensure avatar button wiring in case DOM nodes were replaced
        try { setupAvatarButton(); } catch (e) { /* ignore */ }
      } catch (e) { console.warn('renderToolbar failed on languageChanged', e); }
    });
  } catch (e) { console.warn('Failed to attach languageChanged listener in toolbar', e); }
}

/**
 * Render toolbar content
 */
function renderToolbar() {
  const container = document.getElementById('toolbar-links');
  
  if (!container) return;

  container.innerHTML = '';

  // Create navigation links for each toolbar item
  // Added extra keys: projects, team, reports, settings, help
  const toolbarKeys = ['view 1', 'view 2', 'view 3', 'view 4', 'view 5', 'view 6', 'view 7', 'view 8', 'view 10'];
  toolbarKeys.forEach(key => {
    // Use the key directly so callers can add translations as `"view1": {...}`
    // in `language_strings.json` (per request: do not prepend 'toolbar.').
    const text = typeof getString === 'function' ? getString(key) : key;
    if (text) {
      const a = document.createElement('a');
      a.className = 'button_index';
      a.href = key + '.html';
      // place the visible label inside a span so text-overflow can work
      const label = document.createElement('span');
      label.className = 'button_label';
      label.textContent = text;
      a.appendChild(label);
      container.appendChild(a);
    }
  });

  // Add train SVG inline for full CSS control
  const trainContainer = document.querySelector('.toolbar-train');
  if (trainContainer) {
    // Only insert the train SVG if it hasn't been added yet to avoid
    // removing other elements (like the avatar button) or duplicating the SVG
    if (!trainContainer.querySelector('.inline-train-svg')) {
      trainContainer.insertAdjacentHTML('afterbegin', `
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
    `);
    }
  }
  // After rendering links, ensure the links container has a pixel min-width
  // so it won't shrink past the buttons' minimum widths. This helps enforce
  // the visual requirement that when buttons reach their min (50px)
  // the parent stops shrinking further.
  if (typeof ensureToolbarMinWidth === 'function') ensureToolbarMinWidth();
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
      if (typeof window.initUserMenu === 'function' && typeof window.openUserMenu === 'function') {
        console.log('User menu module found, initializing...');
        try {
          await window.initUserMenu();
          console.log('User menu initialized successfully');
          return true;
        } catch (err) {
          console.error('Failed to initialize user menu:', err);
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

  // Add click event to open profile modal (ignore when user data not loaded)
  avatarBtn.addEventListener('click', async (e) => {
    // If no user data in memory yet, or no avatar image loaded, ignore the click
    try {
      const avatarEl = document.getElementById('toolbar-avatar');
      const hasImg = !!(avatarEl && avatarEl.querySelector && avatarEl.querySelector('img'));
      const storeImage = (window.AvatarStore && typeof window.AvatarStore.getImage === 'function') ? window.AvatarStore.getImage() : null;

      if (!window.currentUser || window.userDataReady === false || (!hasImg && !storeImage)) {
        console.log('Avatar click ignored — user not ready or no avatar image', { hasImg, hasStoreImage: !!storeImage, userDataReady: window.userDataReady });
        e.preventDefault();
        return;
      }
    } catch (err) {
      console.warn('Error checking avatar presence, allowing click as fallback', err);
    }

    e.preventDefault();
    e.stopPropagation();
    console.log('Avatar button clicked');
    // Ensure the user menu is initialized before opening it to avoid missing DOM nodes
    try {
      if (typeof window.initUserMenu === 'function') {
        try {
          await window.initUserMenu();
        } catch (initErr) {
          console.warn('initUserMenu failed during avatar click:', initErr);
        }
      }

      if (typeof window.openUserMenu === 'function') {
        console.log('Calling window.openUserMenu()');
        try {
          await window.openUserMenu();
        } catch (err) {
          console.error('Error opening user menu:', err);
        }
      } else {
        console.warn('window.openUserMenu is not yet available');
      }
    } catch (err) {
      console.error('Avatar click handler error:', err);
    }
  });
}

/**
 * Compute a pixel min-width for the links container so it cannot shrink
 * smaller than the sum of the buttons' min widths, gaps, paddings, and
 * the train area. This avoids layout collapse when buttons reach their
 * CSS `min-width`.
 */
function ensureToolbarMinWidth() {
  try {
    const links = document.getElementById('toolbar-links');
    if (!links) return;

    const buttons = Array.from(links.querySelectorAll('.button_index'));
    if (!buttons.length) return;

    const linksStyle = getComputedStyle(links);
    const gap = parseFloat(linksStyle.gap || linksStyle.columnGap || 0) || 0;
    const paddingLeft = parseFloat(linksStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(linksStyle.paddingRight) || 0;

    // Sum each button's computed min-width (fallback to 50 if unknown), plus
    // its horizontal margins. Computed min-width is typically in pixels.
    let total = 0;
    buttons.forEach(btn => {
      const cs = getComputedStyle(btn);
      // computed minWidth may be 'auto' or '0px' in some layouts; fall back
      // to the known CSS minimum of 50px used in our stylesheet.
      let minW = parseFloat(cs.minWidth);
      if (!minW || isNaN(minW)) minW = 50;
      const mLeft = parseFloat(cs.marginLeft) || 0;
      const mRight = parseFloat(cs.marginRight) || 0;
      total += minW + mLeft + mRight;
    });

    // Add gaps between buttons
    if (buttons.length > 1) total += gap * (buttons.length - 1);

    // Add container paddings
    total += paddingLeft + paddingRight;

    // If the toolbar includes the train area on the right, include its width
    const train = document.querySelector('.toolbar-train');
    if (train) {
      const trainRect = train.getBoundingClientRect();
      const trainStyle = getComputedStyle(train);
      const trainMargin = (parseFloat(trainStyle.marginLeft) || 0) + (parseFloat(trainStyle.marginRight) || 0);
      total += Math.ceil(trainRect.width + trainMargin);
    }

    // Apply a small safety buffer to avoid sub-pixel issues
    const buffer = 2;
    const minWidthPx = Math.ceil(total) + buffer;

    // Only set if different to avoid layout churn
    if (links.style.minWidth !== minWidthPx + 'px') {
      links.style.minWidth = minWidthPx + 'px';
      // Also set the toolbar element minWidth to keep visual consistency
      const toolbarEl = document.querySelector('.toolbar');
      if (toolbarEl) toolbarEl.style.minWidth = minWidthPx + 'px';
    }
  } catch (err) {
    // Fail silently — this is a graceful enhancement
    console.warn('ensureToolbarMinWidth failed', err);
  }
}

// Debounced resize handler to recompute min-width when the viewport changes
let __toolbarResizeTimer = null;
window.addEventListener('resize', () => {
  if (__toolbarResizeTimer) clearTimeout(__toolbarResizeTimer);
  __toolbarResizeTimer = setTimeout(() => {
    if (typeof ensureToolbarMinWidth === 'function') ensureToolbarMinWidth();
  }, 120);
});

/**
 * Display user avatar in toolbar
 */
function displayToolbarAvatar() {
  try {
    // If an in-memory avatar is already cached, render it immediately and
    // skip querying the profiles table to avoid duplicate work.
    const storeImage = window.AvatarStore && typeof window.AvatarStore.getImage === 'function'
      ? window.AvatarStore.getImage()
      : null;

    const avatarElImmediate = document.getElementById('toolbar-avatar');
    if (storeImage && avatarElImmediate) {
      // Ensure single avatar image element exists and update it to avoid duplicates
      let img = document.getElementById('toolbar-avatar-img');
      if (!img) {
        avatarElImmediate.innerHTML = '';
        img = document.createElement('img');
        img.id = 'toolbar-avatar-img';
        avatarElImmediate.appendChild(img);
      }
      img.src = storeImage;
      img.alt = (window.currentUser && `${window.currentUser.email}`) || '';
      return;
    }

    // Otherwise wait for currentUser and then query profile to obtain avatar_url
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
            // populate the AvatarStore for future use
            if (window.AvatarStore && typeof window.AvatarStore.setImage === 'function') {
              try { window.AvatarStore.setImage(profile.avatar_url); } catch (e) { /* ignore */ }
            }

            // Ensure single avatar image element exists and update it
            let img = document.getElementById('toolbar-avatar-img');
            if (!img) {
              avatarEl.innerHTML = '';
              img = document.createElement('img');
              img.id = 'toolbar-avatar-img';
              avatarEl.appendChild(img);
            }
            img.src = profile.avatar_url;
            img.alt = `${profile.first_name} ${profile.last_name}`;
          } else {
            // Show placeholder via translation when available; no hardcoded fallback
            if (typeof getString === 'function') {
              avatarEl.textContent = '';
            } else {
              avatarEl.textContent = '';
            }
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
    const avatarUrl = event && event.detail && event.detail.avatarUrl;
    const avatarElement = document.getElementById('toolbar-avatar');

    if (!avatarElement) {
      // If toolbar avatar element is missing, fallback to full render
      displayToolbarAvatar();
      return;
    }

    // If there's already an <img> inside the avatar container, update its src directly
    const existingImg = avatarElement.querySelector('img');
    if (existingImg) {
      if (avatarUrl) existingImg.src = avatarUrl;
      // Update alt/title if provided
      if (event && event.detail && event.detail.alt) existingImg.alt = event.detail.alt;
      return;
    }

    // No <img> present — insert one if we have a URL
    if (avatarUrl) {
      avatarElement.innerHTML = '';
      const img = document.createElement('img');
      img.src = avatarUrl;
      img.alt = (window.currentUser && `${window.currentUser.email}`) || '';
      avatarElement.appendChild(img);
      return;
    }

    // Otherwise, fall back to the full rendering logic
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

