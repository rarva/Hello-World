// ===============================
// Home Error Handling Module
// ===============================
// Centralized error handling for home/main content area

/**
 * Show error message in home container
 * @param {string} message - Error message to display
 */
window.showHomeError = function(message) {
  const homeContainer = document.getElementById('home-container');
  if (homeContainer) {
    homeContainer.innerHTML = `<div style="color: var(--color-error); padding: 20px; text-align: center; font-weight: bold;">${message}</div>`;
  }
};

/**
 * Show loading message in home container
 * @param {string} messageKey - Key from language_strings.json
 */
window.showHomeLoading = function(messageKey) {
  const homeContainer = document.getElementById('home-container');
  if (homeContainer) {
    const message = typeof getString === 'function' ? getString(messageKey) : messageKey;
    homeContainer.innerHTML = `<div style="padding: 20px; text-align: center;">${message}</div>`;
  }
};

/**
 * Clear home messages
 */
window.clearHomeMessages = function() {
  const homeContainer = document.getElementById('home-container');
  if (homeContainer) {
    homeContainer.innerHTML = '';
  }
};
