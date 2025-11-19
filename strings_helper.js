// ===============================
// Strings Helper Module
// ===============================
// This module handles loading and retrieving strings from strings.json

let stringsData = null;
let currentLanguage = localStorage.getItem('language') || 'pt';

/**
 * Load strings from strings.json
 */
async function loadStrings() {
  try {
    const response = await fetch('strings.json');
    stringsData = await response.json();
  } catch (err) {
    console.error('Failed to load strings:', err);
    stringsData = {};
  }
}

/**
 * Get a string value from the strings.json by key path.
 * @param {string} keyPath - Path to the string (e.g., 'login.email', 'app.welcome')
 * @returns {string} The translated string or the keyPath if not found
 */
function getString(keyPath) {
  if (!stringsData) {
    console.warn('Strings not loaded yet');
    return keyPath;
  }
  if (stringsData[keyPath] && stringsData[keyPath][currentLanguage]) {
    return stringsData[keyPath][currentLanguage];
  }
  return keyPath;
}

/**
 * Set the current language
 * @param {string} lang - Language code (e.g., 'en', 'pt')
 */
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
}

/**
 * Get the current language
 * @returns {string} The current language code
 */
function getLanguage() {
  return currentLanguage;
}
