document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!firstName || !lastName || !email || !password) {
      return alert('All fields are required.');
    }

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password
        })
      });

      if (res.ok) {
        alert('Registration successful!');
        window.location.href = '/login.html';
      } else {
        const { error } = await res.json();
        alert(error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Server error. Please try again later.');
    }
  });
});
