
// Loader: loads login and footer containers into #main-container
function loadContainers() {
  // Load login content into existing placeholder
  fetch('login/login.html')
    .then(res => res.text())
    .then(html => {
      const loginContainer = document.getElementById('login-container');
      loginContainer.innerHTML = html;
      
      // Ensure initLogin is called after DOM is updated
      if (typeof initLogin === 'function') {
        initLogin();
      } else {
        const script = document.createElement('script');
        script.src = 'login/load_login.js';
        script.onload = () => {
          if (typeof initLogin === 'function') initLogin();
        };
        document.body.appendChild(script);
      }
    })
    .catch(err => {
      const loginContainer = document.getElementById('login-container');
      loginContainer.innerHTML = '<div style="color:red">Failed to load login form.</div>';
      console.error('Failed to load login form:', err);
    });

  // Load footer content into existing placeholder
  fetch('footer/footer.html')
    .then(res => res.text())
    .then(html => {
      const footerContainer = document.getElementById('footer-container');
      footerContainer.innerHTML = html;
      
      // Load footer JS after HTML is present
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'footer/footer_styles.css';
      document.head.appendChild(style);
      const script = document.createElement('script');
      script.src = 'footer/load_footer.js';
      document.body.appendChild(script);
      const errorScript = document.createElement('script');
      errorScript.src = 'footer/footer_error_handling.js';
      document.body.appendChild(errorScript);
    });
}

window.addEventListener('DOMContentLoaded', () => {
  loadContainers();
});
