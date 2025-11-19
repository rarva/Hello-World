// ===============================
// Footer Module
// ===============================
// Handles app-wide notifications/info in the footer



// Footer initialization logic (mirroring login)
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

// Run footer init after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooter);
} else {
  initFooter();
}
