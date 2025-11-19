// Language switcher logic for login page
console.log('Language switcher script loaded');
(function attachLangSwitcher() {
  var tries = 0;
  var maxTries = 40;
  var poll = setInterval(function() {
    var langIcon = document.getElementById('lang-switcher');
    var langSelect = document.getElementById('lang-select');
    if (langIcon && langSelect) {
      clearInterval(poll);
      langIcon.addEventListener('click', function() {
        console.log('Globe clicked');
        langSelect.style.display = (langSelect.style.display === 'none') ? 'inline-block' : 'none';
      });
      langSelect.value = (typeof getLanguage === 'function') ? getLanguage() : 'en';
      langSelect.addEventListener('change', function() {
        console.log('Language changed to', langSelect.value);
        if (typeof setLanguage === 'function') setLanguage(langSelect.value);
        if (typeof loadStrings === 'function') {
          console.log('[lang_switcher] Calling loadStrings...');
          loadStrings().then(function() {
            console.log('[lang_switcher] loadStrings resolved, calling populateLoginStrings...');
            if (typeof populateLoginStrings === 'function') populateLoginStrings();
          });
        }
        langSelect.style.display = 'none';
      });
    } else if (++tries > maxTries) {
      clearInterval(poll);
      console.log('Language switcher or dropdown not found after polling');
    }
  }, 100);
})();
