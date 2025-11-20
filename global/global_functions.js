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
