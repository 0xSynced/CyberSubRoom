document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const usernameInput = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
  
      // Admin shortcut [username: admin, password: admin] which will redirect to admin.html page :)
      if (usernameInput === 'admin' && password === 'admin') {
        window.location.href = '/admin.html';
        return;
      }
  
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const users = await res.json();
  
        const user = users.find(u => {
            const fullNameMatch = u.name.toLowerCase() === usernameInput.toLowerCase();
            const firstNameMatch = u.name.split(' ')[0].toLowerCase() === usernameInput.toLowerCase();
            const emailMatch = u.email.toLowerCase() === usernameInput.toLowerCase();
            return (emailMatch || fullNameMatch || firstNameMatch) && u.password === password;
          });
          
        if (user) {
          localStorage.setItem('loggedInUserEmail', user.email);
          window.location.href = '/user.html';
        } else {
          alert('Invalid credentials');
        }
      } catch (err) {
        console.error('Login error:', err);
        alert('Login failed. Try again.');
      }
    });
  });
  