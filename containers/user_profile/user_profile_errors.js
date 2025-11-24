/* Simple error helpers for user profile page */
(function(){
  function showUserProfileError(msg){
    const el = document.getElementById('user-profile-errors');
    if(el) el.textContent = msg;
  }
  function clearUserProfileErrors(){
    const el = document.getElementById('user-profile-errors');
    if(el) el.textContent = '';
  }
  window.showUserProfileError = showUserProfileError;
  window.clearUserProfileErrors = clearUserProfileErrors;
})();
