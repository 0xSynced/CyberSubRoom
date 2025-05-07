// File: public/scripts/plans.js

document.addEventListener('DOMContentLoaded', async () => {
  const email = localStorage.getItem('loggedInUserEmail');
  if (!email) return window.location.href = '/login.html';

  const container = document.getElementById('dynamic-plans');

  try {
    const res = await fetch('/api/plans');
    const plans = await res.json();

    plans.forEach(plan => {
      const div = document.createElement('div');
      div.className = `plan-card ${plan.name.toLowerCase()}`;

      const price = parseFloat(plan.price).toFixed(2);
      const features = plan.description
        .split('\n')
        .map(line => `<li>${line.trim()}</li>`) 
        .join('');

      div.innerHTML = `
        ${plan.name.toLowerCase() === 'premium' ? '<div class="best-value">Best Value</div>' : ''}
        <h2>${plan.name}</h2>
        <div class="price">$${price}<span>/month</span></div>
        <ul class="features">${features}</ul>
        <button class="plan-button" data-plan="${plan.name}">Choose ${plan.name}</button>
      `;

      container.appendChild(div);
    });

    // Plan subscription button click
    container.addEventListener('click', async (e) => {
      if (!e.target.classList.contains('plan-button')) return;
      const plan = e.target.getAttribute('data-plan');

      const userRes = await fetch('/api/users');
      const users = await userRes.json();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return alert('User not found');

      if (confirm(`This will simulate a payment and subscribe you to ${plan}. Proceed?`)) {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, plan })
        });

        alert('Subscription updated!');
        window.location.reload();
      }
    });
  } catch (err) {
    console.error('Error loading plans:', err);
    alert('Failed to load plans.');
  }
});
