
// Minimal loader: only loads login form into #app and keeps styling
function loadLoginForm() {
  fetch('login/login.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('app').innerHTML = html;
      // Ensure initLogin is called after DOM is updated
      if (typeof initLogin === 'function') {
        initLogin();
      } else {
        // If not loaded yet, wait for script
        const script = document.createElement('script');
        script.src = 'login/load_login.js';
        script.onload = () => {
          if (typeof initLogin === 'function') initLogin();
        };
        document.body.appendChild(script);
      }
    })
    .catch(err => {
      document.getElementById('app').innerHTML = '<div style="color:red">Failed to load login form.</div>';
      console.error('Failed to load login form:', err);
    });
}

window.addEventListener('DOMContentLoaded', () => {
  loadLoginForm();
});
