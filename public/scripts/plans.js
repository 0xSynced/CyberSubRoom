// File: public/scripts/plans.js

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('dynamic-plans');
  
  // Check if plans are already rendered by EJS
  if (!container.querySelector('.plan-card')) {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      const plans = await response.json();
      
      if (!plans || plans.length === 0) {
        container.innerHTML = '<p>No plans available at the moment.</p>';
        return;
      }
      
      // Render plans if not already rendered by EJS
      container.innerHTML = plans.map(plan => {
        const price = parseFloat(plan.price);
        let features = ['24/7 Basic Support', 'Email Notifications'];
        
        if (price > 0) {
          features.push('Advanced Threat Detection', 'Real-time Monitoring');
        }
        if (price >= 9.99) {
          features.push('DDoS Protection', 'Malware Scanning', 'VPN Access');
        }
        if (price >= 19.99) {
          features.push('Priority Support', 'Advanced Firewall', 'Cloud Backup', 'Custom Security Rules', 'Team Management');
        }
        
        return `
          <div class="plan-card ${plan.name.toLowerCase()}">
            ${plan.name.toLowerCase() === 'premium' ? '<div class="best-value">Best Value</div>' : ''}
            <h2>${plan.name}</h2>
            <div class="price">$${price.toFixed(2)}<span>/month</span></div>
            <ul class="features">
              ${features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <button class="plan-button" data-plan="${plan.name}">Choose ${plan.name}</button>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading plans:', error);
      container.innerHTML = '<p>Error loading plans. Please try again later.</p>';
    }
  }

  // Plan subscription button click
  container.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('plan-button')) return;
    const plan = e.target.getAttribute('data-plan');

    // Check if user is logged in
    const email = localStorage.getItem('loggedInUserEmail');
    if (!email) {
      if (confirm('Please login or register to subscribe to a plan. Would you like to login now?')) {
        window.location.href = '/login';
      }
      return;
    }

    try {
      const userRes = await fetch('/api/users');
      if (!userRes.ok) {
        throw new Error('Failed to fetch user data');
      }
      const users = await userRes.json();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        alert('User not found. Please try logging in again.');
        window.location.href = '/login';
        return;
      }

      if (confirm(`This will simulate a payment and subscribe you to ${plan}. Proceed?`)) {
        const updateRes = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, plan })
        });
        
        if (!updateRes.ok) {
          throw new Error('Failed to update plan');
        }

        alert('Subscription updated successfully!');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      alert('Failed to update plan. Please try again.');
    }
  });
});
