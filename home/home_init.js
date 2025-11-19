// ===============================
// Home Module
// ===============================
// Handles home (main content area) initialization and view loading

/**
 * Initialize home container: load HTML and styles
 */
function initHomeContainer() {
  fetch('home/home.html')
    .then(res => res.text())
    .then(html => {
      const homeContainer = document.getElementById('home-container');
      homeContainer.innerHTML = html;
      
      // Load home styles
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'home/home_styles.css';
      document.head.appendChild(style);
      
      // Initialize home after HTML is present
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
  
  fetch(`home/${viewName}.html`)
    .then(res => res.text())
    .then(html => {
      homeContainer.innerHTML = html;
    })
    .catch(err => {
      console.error(`Failed to load home view: ${viewName}`, err);
      homeContainer.innerHTML = `<div style="color:red">Failed to load ${viewName}.</div>`;
    });
}

/**
 * Initialize home module
 */
function initHome() {
  // Home is loaded via loadHomeView() when needed
}
