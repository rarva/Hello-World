// ===============================
// Language Manager Module
// ===============================
// This module handles loading and retrieving strings from strings.json for i18n support

let stringsData = null;
let currentLanguage = null;

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'pt', 'de', 'fr', 'it'];

/**
 * Initialize language on app start
 * - Check localStorage first (persisted preference)
 * - Then try to detect browser/system language
 * - Fallback to English
 */
function initializeLanguage() {
  // First check if user has a saved preference in localStorage
  if (localStorage.getItem('language')) {
    currentLanguage = localStorage.getItem('language');
    return currentLanguage;
  }
  
  // No saved preference, detect browser language
  const browserLang = detectBrowserLanguage();
  currentLanguage = browserLang;
  localStorage.setItem('language', browserLang);
  return currentLanguage;
}

/**
 * Detect browser/system language
 * @returns {string} Language code (en, pt, de, fr, it) or 'en' as fallback
 */
function detectBrowserLanguage() {
  // Get browser language (e.g., 'pt-BR', 'en-US', 'de')
  const browserLangs = navigator.languages || [navigator.language];
  
  for (const lang of browserLangs) {
    // Extract primary language code (e.g., 'pt' from 'pt-BR')
    const primaryLang = lang.split('-')[0].toLowerCase();
    
    // Check if it's a supported language
    if (SUPPORTED_LANGUAGES.includes(primaryLang)) {
      console.log('Detected browser language:', primaryLang);
      return primaryLang;
    }
  }
  
  // Fallback to English
  console.log('Browser language not supported, defaulting to English');
  return 'en';
}

/**
 * Load strings from language_strings.json
 */
async function loadStrings() {
  try {
    const response = await fetch('language_strings.json');
    stringsData = await response.json();
    
    // Initialize language on first load
    if (!currentLanguage) {
      initializeLanguage();
    }
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
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    try {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    } catch (e) {
      console.warn('languageChanged event dispatch failed', e);
    }
  }
}

/**
 * Get the current language
 * @returns {string} The current language code
 */
function getLanguage() {
  // Make sure language is initialized
  if (!currentLanguage) {
    initializeLanguage();
  }
  return currentLanguage;
}

/**
 * Update language from user's profile after login
 * @param {string} profileLanguage - Language code from database
 */
function updateLanguageFromProfile(profileLanguage) {
  // If the user explicitly chose a language during this session (e.g. via
  // the login language selector), prefer the user's choice and do not
  // overwrite it with the stored profile language.
  try {
    if (localStorage.getItem('language_chosen_by_user') === '1') {
      console.log('Profile language present but user chose language in UI; keeping user choice');
      return;
    }
  } catch (e) {
    // ignore localStorage errors and fall back to normal behavior
  }

  if (profileLanguage && SUPPORTED_LANGUAGES.includes(profileLanguage)) {
    currentLanguage = profileLanguage;
    localStorage.setItem('language', profileLanguage);
    console.log('Updated language from profile:', profileLanguage);
    try {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: profileLanguage } }));
    } catch (e) {
      console.warn('languageChanged event dispatch failed', e);
    }
  }
}
