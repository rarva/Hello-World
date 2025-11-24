// ===============================
// Home Module
// ===============================
// Handles home (main content area) initialization and view loading

/**
 * Initialize home container: load HTML and styles
 */
function initHomeContainer() {
  fetch('containers/home/home.html')
    .then(res => res.text())
    .then(async html => {
      const homeContainer = document.getElementById('home-container');
      homeContainer.innerHTML = html;

      // Load home styles and wait to avoid FOUC
      if (window.loadStylesheetSafe) {
        await window.loadStylesheetSafe('containers/home/home_styles.css', 'home-styles');
      } else {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = 'containers/home/home_styles.css';
        document.head.appendChild(style);
      }

      // Initialize home after HTML and styles are present
      initHome();
    })
    .catch(err => {
      showHomeError('Failed to load home');
      console.error('Failed to load home:', err);
    });
}

/**
 * Load a view/page into the home container
 */
function loadHomeView(viewName) {
  const homeContainer = document.getElementById('home-container');
  if (!homeContainer) {
    console.error('Home container not found');
    return;
  }
  
  fetch(`containers/home/${viewName}.html`)
    .then(res => res.text())
    .then(html => {
      homeContainer.innerHTML = html;
    })
    .catch(err => {
      console.error(`Failed to load home view: ${viewName}`, err);
      if (typeof getString === 'function') {
        const tpl = getString('home.load_failed');
        homeContainer.innerHTML = `<div style="color: var(--color-error)">${tpl.replace('{view}', viewName)}</div>`;
      } else {
        homeContainer.innerHTML = `<div style="color: var(--color-error)">Failed to load ${viewName}.</div>`;
      }
    });
}

/**
 * Initialize home module
 */
function initHome() {
  // Home is loaded via loadHomeView() when needed
}
