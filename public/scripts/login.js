document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
  
    form.addEventListener('submit', (e) => {
        const usernameInput = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Admin shortcut [username: admin, password: admin] which will redirect to admin page
        if (usernameInput === 'admin' && password === 'admin') {
            e.preventDefault();
            window.location.href = '/admin';
            return;
        }
    });
});
  