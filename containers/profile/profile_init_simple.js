// Test file to verify script loading
try {
  console.log('PROFILE TEST: Script loaded');
  
  window.initProfileModal = async () => {
    console.log('initProfileModal called');
  };
  
  window.openProfileModal = async () => {
    console.log('openProfileModal called');
  };
  
  console.log('PROFILE TEST: Exports complete');
} catch (err) {
  console.error('PROFILE TEST ERROR:', err);
}
