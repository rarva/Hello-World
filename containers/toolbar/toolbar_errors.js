// ===============================
// Toolbar Error Handling Module
// ===============================
// Centralized error handling for toolbar

/**
 * Show error message in toolbar
 * @param {string} message - Error message to display
 */
window.showToolbarError = function(message) {
  const toolbarLinks = document.getElementById('toolbar-links');
  if (toolbarLinks) {
    toolbarLinks.innerHTML = `<div style="color: var(--color-error); padding: 10px; font-weight: bold;">${message}</div>`;
  }
};

/**
 * Show loading message in toolbar
 * @param {string} messageKey - Key from strings.json
 */
window.showToolbarLoading = function(messageKey) {
  const toolbarLinks = document.getElementById('toolbar-links');
  if (toolbarLinks) {
    const message = typeof getString === 'function' ? getString(messageKey) : messageKey;
    toolbarLinks.innerHTML = `<div style="padding: 10px;">${message}</div>`;
  }
};

/**
 * Clear toolbar messages
 */
window.clearToolbarMessages = function() {
  const toolbarLinks = document.getElementById('toolbar-links');
  if (toolbarLinks) {
    toolbarLinks.innerHTML = '';
  }
};
