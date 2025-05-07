document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('user-form');
    const tbody = document.querySelector('#user-table-body');
  
    let editingUserId = null;
  
    async function loadUsers() {
      const res = await fetch('/api/users');
      const users = await res.json();
      tbody.innerHTML = '';
  
      users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.plan}</td>
        <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
        <td>
          <button class="edit-btn" data-id="${user.id}">Edit</button>
          <button class="delete-btn" data-id="${user.id}">Delete</button>
        </td>
      `;
             tbody.appendChild(tr);
      });
  
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const res = await fetch(`/api/users`);
          const users = await res.json();
          const user = users.find(u => u.id == id);
          if (!user) return alert('User not found');
  
          document.getElementById('name').value = user.name;
          document.getElementById('email').value = user.email;
          document.getElementById('role').value = user.role;
          document.getElementById('plan').value = user.plan;
          document.getElementById('status').value = user.status;
  
          editingUserId = id;
        });
      });
  
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Delete this user?')) {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) loadUsers();
            else alert('Delete failed');
          }
        });
      });
    }
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        plan: document.getElementById('plan').value,
        status: document.getElementById('status').value
      };
  
      let res;
      if (editingUserId) {
        res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
  
      if (res.ok) {
        form.reset();
        editingUserId = null;
        loadUsers();
      } else {
        alert('Error saving user');
      }
    });
  
    loadUsers();
  });
  