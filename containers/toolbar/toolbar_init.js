// ===============================
// Toolbar Module
// ===============================
// Handles toolbar initialization, navigation, and container loading

/**
 * Initialize toolbar container: load HTML and styles
 */
function initToolbarContainer() {
  fetch('containers/toolbar/toolbar.html')
    .then(res => res.text())
    .then(html => {
      const toolbarContainer = document.getElementById('toolbar-container');
      toolbarContainer.innerHTML = html;
      
      // Load toolbar styles
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'containers/toolbar/toolbar_styles.css';
      document.head.appendChild(style);
      
      // Initialize toolbar after HTML is present
      initToolbar();
    })
    .catch(err => {
      showToolbarError('Failed to load toolbar');
      console.error('Failed to load toolbar:', err);
    });
}

/**
 * Initialize toolbar after HTML is loaded
 */
function initToolbar() {
  // Load strings and initialize toolbar
  if (typeof loadStrings === 'function') {
    loadStrings().then(() => {
      renderToolbar();
    }).catch(error => {
      showToolbarError('Toolbar error');
      console.error('Toolbar load error:', error);
    });
  } else {
    renderToolbar();
  }
}

/**
 * Render toolbar content
 */
function renderToolbar() {
  const container = document.getElementById('toolbar-links');
  
  if (!container) return;

  container.innerHTML = '';

  // Create navigation links for each toolbar item
  const toolbarKeys = ['home', 'about', 'contact'];
  toolbarKeys.forEach(key => {
    const toolbarKey = `toolbar.${key}`;
    const text = typeof getString === 'function' ? getString(toolbarKey) : key;
    if (text) {
      const a = document.createElement('a');
      a.href = key + '.html';
      a.textContent = text;
      container.appendChild(a);
    }
  });

  // Add train SVG inline for full CSS control
  const trainContainer = document.querySelector('.toolbar-train');
  if (trainContainer) {
    trainContainer.innerHTML = `
      <svg class="inline-train-svg" viewBox="0 0 557 281" xmlns="http://www.w3.org/2000/svg" width="557" height="281">
        <g id="Background">
          <g>
            <path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M360,66c6,1,13,7,19,11c16,12,39,27,54,44v3c-2,1-4,1-6,1
              c-3,0-50-11-73-18c-7-2-13-4-18-8c-8-5-15-12-22-18c-2-1-14-11-14-15c0-6,11-4,13-4C316,62,345,62,360,66z M99,0l67,11h34
              c88,5,178,37,269,127c7,8,20,10,30,15c16,9,47,28,54,49c2,6,4,17,4,20c0,24-17,45-48,55c-5,1-14,4-17,4H7H0V0h9H99z"/>
            <line fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" x1="0" y1="281" x2="9" y2="281"/>
          </g>
        </g>
        <g id="Layer_1"></g>
      </svg>
    `;
  }
}
