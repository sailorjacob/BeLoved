// Keyboard helper functions for iOS
document.addEventListener('DOMContentLoaded', function() {
  // Get all input fields
  const inputFields = document.querySelectorAll('input, textarea');
  
  // Add click and focus listeners to all input fields
  inputFields.forEach(input => {
    // Add a click handler to force focus
    input.addEventListener('click', function(e) {
      // Slight delay can help with iOS keyboard issues
      setTimeout(() => {
        this.focus();
      }, 100);
    });
    
    // Double-tap handler as a fallback
    let lastTap = 0;
    input.addEventListener('touchend', function(e) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        this.focus();
      }
      lastTap = currentTime;
    });
  });

  // For specifically handling login form
  const emailInput = document.querySelector('input[type="email"], input[placeholder*="email"]');
  const passwordInput = document.querySelector('input[type="password"]');
  
  if (emailInput) {
    emailInput.addEventListener('focus', function() {
      // Scroll to make sure the input is visible when keyboard appears
      setTimeout(() => {
        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('focus', function() {
      // Scroll to make sure the input is visible when keyboard appears
      setTimeout(() => {
        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  }
});