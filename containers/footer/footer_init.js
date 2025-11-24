// ===============================
// Footer Module
// ===============================
// Handles app-wide notifications/info in the footer

/**
 * Initialize footer container: load HTML and styles
 */
function initFooterContainer() {
  fetch('containers/footer/footer.html')
    .then(res => res.text())
    .then(async html => {
      const footerContainer = document.getElementById('footer-container');
      footerContainer.innerHTML = html;
      
      // Load footer styles and wait to avoid FOUC
      try {
        if (window.loadStylesheetSafe) await window.loadStylesheetSafe('containers/footer/footer_styles.css', 'footer-styles');
        else {
          const style = document.createElement('link');
          style.rel = 'stylesheet';
          style.href = 'containers/footer/footer_styles.css';
          document.head.appendChild(style);
        }
      } catch (e) {
        console.warn('Footer stylesheet failed to load safely', e);
      }

      // Initialize footer after HTML and styles are present
      initFooter();
    })
    .catch(err => {
      if (typeof getString === 'function') showFooterError(getString('footer.load_failed'));
      else showFooterError('Failed to load footer');
      console.error('Failed to load footer:', err);
    });
}

/**
 * Initialize footer after HTML is loaded
 */
async function initFooter() {
  await loadStrings();
  if (window.getString) {
    // Set Supabase status
    const indicator = document.getElementById('footer-supabase-indicator');
    if (indicator) {
      const isOnline = !!(window.supabase && window.SUPABASE_URL);
      indicator.textContent = getString(isOnline ? 'login.supabase_connected' : 'login.supabase_offline');
      indicator.className = 'footer-indicator ' + (isOnline ? 'online' : 'offline');
    }
    // Set footer info (example: copyright)
    const info = document.getElementById('footer-info');
    if (info) info.textContent = getString('footer.copyright');
  }
  
}

// Re-run footer string updates when language changes
try {
  window.addEventListener('languageChanged', () => {
    try { initFooter(); } catch (e) { console.warn('initFooter failed on languageChanged', e); }
  });
} catch (e) { console.warn('Failed to attach languageChanged listener in footer', e); }

/**
 * Handle logout
 */
// logout is handled by profile component (profile-logout-btn)
