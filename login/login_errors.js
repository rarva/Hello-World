// ===============================
// Login Error Handling Module
// ===============================
// Centralized error handling for login form validation and display

/**
 * Show a field-specific error message and highlight the field.
 * @param {string} field - Field name ('email', 'password', 'confirm')
 * @param {string} message - Error message
 */
window.showFieldError = function(field, message) {
  const errorId = field === 'confirm' ? 'confirm-error' : `${field}-error`;
  const inputId = field === 'confirm' ? 'password-confirm' : field;
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  if (inputEl) {
    inputEl.classList.add('error');
  }
};

/**
 * Show a general error or info message at the top of the form.
 * @param {string} message
 */
window.showGeneralMessage = function(message) {
  const generalError = document.getElementById('general-error');
  if (generalError) {
    generalError.textContent = message;
    generalError.style.display = 'block';
  }
};

/**
 * Clear all error messages and field highlights in the form.
 */
window.clearAllErrors = function() {
  const errorIds = ['email-error', 'password-error', 'confirm-error', 'general-error'];
  const inputIds = ['email', 'password', 'password-confirm'];
  errorIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  inputIds.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.classList.remove('error');
  });
};

