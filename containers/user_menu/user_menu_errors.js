// User menu error handling (compat layer for profile errors)
window.showProfileError = (fieldName, errorMessage) => {
  const errorElement = document.getElementById(`profile-error-${fieldName}`);
  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.style.display = 'block';
  }
};

window.clearProfileError = (fieldName) => {
  const errorElement = document.getElementById(`profile-error-${fieldName}`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
};

window.clearAllProfileErrors = () => {
  const errorElements = document.querySelectorAll('[id^="profile-error-"]');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
};

window.showProfileGeneralError = (message) => {
  console.error('Profile error:', message);
};
