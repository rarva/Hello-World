// ===============================
// Footer Module
// ===============================
// Handles app-wide notifications/info in the footer

/**
 * Initialize footer container: load HTML and styles
 */
function initFooterContainer() {
  fetch('footer/footer.html')
    .then(res => res.text())
    .then(html => {
      const footerContainer = document.getElementById('footer-container');
      footerContainer.innerHTML = html;
      
      // Load footer styles
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'footer/footer_styles.css';
      document.head.appendChild(style);
      
      // Initialize footer after HTML is present
      initFooter();
    })
    .catch(err => {
      showFooterError('Failed to load footer');
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
  
  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.textContent = getString('app.logout');
    logoutBtn.addEventListener('click', handleLogout);
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  if (window.supabase) {
    try {
      await window.supabase.auth.signOut();
      // Don't remove rememberedEmail - keep it so user can quickly log back in
      // Only Supabase tokens are cleared by signOut()
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Logout failed');
    }
  }
}
