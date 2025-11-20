/**
 * onboarding_errors.js
 * Error handling for onboarding module
 */

window.showOnboardingError = function(message) {
  const errorEl = document.getElementById('onboarding-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
};

window.clearOnboardingError = function() {
  const errorEl = document.getElementById('onboarding-error');
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
};
