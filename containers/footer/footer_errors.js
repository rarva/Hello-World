// ===============================
// Footer Error Handling Module
// ===============================
// Centralized error handling for footer notifications and display

/**
 * Show footer error message
 * @param {string} messageKey - Key from language_strings.json for the error message
 */
window.showFooterError = function(messageKey) {
  const info = document.getElementById('footer-info');
  if (info) {
    info.textContent = typeof getString === 'function' ? getString(messageKey) : messageKey;
    info.style.color = 'var(--color-error)';
  }
};

/**
 * Show footer info message
 * @param {string} messageKey - Key from language_strings.json for the info message
 */
window.showFooterInfo = function(messageKey) {
  const info = document.getElementById('footer-info');
  if (info) {
    info.textContent = typeof getString === 'function' ? getString(messageKey) : messageKey;
    info.style.color = 'inherit';
  }
};

/**
 * Clear footer messages
 */
window.clearFooterMessages = function() {
  const info = document.getElementById('footer-info');
  if (info) {
    info.textContent = '';
    info.style.color = 'inherit';
  }
};
