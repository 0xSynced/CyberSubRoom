document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Real-time username validation
  usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim();
    if (username.includes(' ')) {
      usernameInput.setCustomValidity('Username cannot contain spaces');
    } else if (/^\d/.test(username)) {
      usernameInput.setCustomValidity('Username cannot start with a number');
    } else {
      usernameInput.setCustomValidity('');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate username
    if (!username) {
      return alert('Username is required.');
    }
    if (username.includes(' ')) {
      return alert('Username cannot contain spaces.');
    }
    if (/^\d/.test(username)) {
      return alert('Username cannot start with a number.');
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return alert('Valid email is required.');
    }

    // Validate password
    if (!password) {
      return alert('Password is required.');
    }

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const errorMessage = doc.querySelector('.error-message');
        
        if (errorMessage) {
          alert(errorMessage.textContent);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Server error. Please try again later.');
    }
  });
});
