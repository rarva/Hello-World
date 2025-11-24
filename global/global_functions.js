// ===============================
// Global Functions / Utilities
// ===============================
// Reusable utility functions shared across multiple modules in the application.
// This file contains only pure functions with no state or side effects.
// Functions here are used by various modules (login, onboarding, toolbar, etc.)
// to perform common tasks like validation, formatting, and data manipulation.
//
// Examples of functions in this module:
// - Email validation (isValidEmail)
// - String formatting utilities
// - Data validation helpers
// - DOM manipulation helpers
// - Common calculations

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Safely load a stylesheet and return a Promise that resolves when it's loaded (or on error).
 * Ensures duplicate loads are no-ops and provides a __loaded flag for quick checks.
 * @param {string} href - URL to stylesheet
 * @param {string} id - optional element id to use for the link
 */
function loadStylesheetSafe(href, id) {
  return new Promise((resolve) => {
    const selector = id ? `#${id}` : `link[href="${href}"]`;
    const existing = id ? document.getElementById(id) : document.querySelector(selector);
    if (existing) {
      if (existing.sheet || existing.__loaded) return resolve(existing);
      existing.addEventListener('load', () => resolve(existing));
      existing.addEventListener('error', () => resolve(existing));
      return;
    }

    const link = document.createElement('link');
    if (id) link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.addEventListener('load', () => { link.__loaded = true; resolve(link); });
    link.addEventListener('error', () => { resolve(link); });
    document.head.appendChild(link);
  });
}

// Export helpers on window for simple consumption by modules
window.loadStylesheetSafe = loadStylesheetSafe;
