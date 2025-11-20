/**
 * onboarding_errors.js
 * Error handling for onboarding module
 */

function showOnboardingError(message) {
  const errorEl = document.getElementById('onboarding-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearOnboardingError() {
  const errorEl = document.getElementById('onboarding-error');
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
}
