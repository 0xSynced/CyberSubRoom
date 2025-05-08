// public/scripts/user.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userNameEl = document.querySelector('#user-fullname');
    const userPlanBadge = document.querySelector('#user-plan');
    const accountStatus = document.querySelector('#account-status');
    const lastLogin = document.querySelector('#last-login');
    const currentPlanName = document.querySelector('#current-plan-name');
    const currentPlanPrice = document.querySelector('#current-plan-price');
    const planOptionsContainer = document.querySelector('#plan-cards-container');
    const accountSettingsForm = document.querySelector('#account-settings-form');
    const deleteAccountBtn = document.querySelector('#delete-account-btn');
    const renewPlanBtn = document.querySelector('#renew-plan-btn');
    const editPlanBtn = document.querySelector('#edit-plan-btn');

    let currentUser = null;

    // Fetch user data
    async function fetchUser() {
        const email = localStorage.getItem('loggedInUserEmail');
        if (!email) return (window.location.href = '/login.html');

        try {
            const res = await fetch('/api/users');
            const users = await res.json();
            currentUser = users.find(u => u.email === email);
            if (!currentUser) return (window.location.href = '/login.html');

            // Update user info
            userNameEl.textContent = currentUser.name;
            userPlanBadge.textContent = currentUser.plan;
            userPlanBadge.className = `plan-badge ${currentUser.plan.toLowerCase()}`;
            
            // Update status indicators
            accountStatus.textContent = capitalize(currentUser.status || 'Active');
            lastLogin.textContent = formatDate(currentUser.lastLogin);

            // Update current plan details
            currentPlanName.textContent = `${capitalize(currentUser.plan)} Plan`;
            currentPlanPrice.innerHTML = planPricing(currentUser.plan);

            // Update account settings form
            document.querySelector('#edit-name').value = currentUser.name;
            document.querySelector('#edit-email').value = currentUser.email;

            // Update user initials
            document.querySelector('#user-initials').textContent = getInitials(currentUser.name);

            // Update usage metrics
            updateUsageMetrics(currentUser.plan);
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (!currentUser) {
                alert('Error loading user data. Please try again.');
            }
        }
    }

    // Load available plans
    async function loadPlans() {
        try {
            const res = await fetch('/api/plans');
            const plans = await res.json();
            planOptionsContainer.innerHTML = '';

            plans.forEach(plan => {
                const div = document.createElement('div');
                div.classList.add('plan-card');
                if (plan.name.toLowerCase() === currentUser.plan.toLowerCase()) {
                    div.classList.add('current');
                }
                div.innerHTML = `
                    ${plan.name.toLowerCase() === currentUser.plan.toLowerCase() ? '<div class="current-tag">CURRENT</div>' : ''}
                    <h3>${plan.name}</h3>
                    <div class="plan-card-price">$${parseFloat(plan.price).toFixed(2)} <span>/ month</span></div>
                    <ul>
                        <li>${plan.description.split('\n')[0]}</li>
                        <li>${plan.description.split('\n')[1] || '24/7 Support'}</li>
                        <li>${plan.description.split('\n')[2] || 'Advanced Protection'}</li>
                    </ul>
                    <button class="plan-card-btn" ${plan.name.toLowerCase() === currentUser.plan.toLowerCase() ? 'disabled' : ''} data-plan="${plan.name}">
                        ${plan.name.toLowerCase() === currentUser.plan.toLowerCase() ? 'Current Plan' : 'Choose'}
                    </button>
                `;
                planOptionsContainer.appendChild(div);
            });

            // Add event listeners to plan buttons
            document.querySelectorAll('.plan-card-btn').forEach(btn => {
                btn.addEventListener('click', handlePlanChange);
            });
        } catch (error) {
            console.error('Error loading plans:', error);
            alert('Error loading plans. Please try again.');
        }
    }

    // Handle plan change
    async function handlePlanChange(event) {
        const btn = event.target;
        const selectedPlan = btn.getAttribute('data-plan');
        
        if (selectedPlan.toLowerCase() === currentUser.plan.toLowerCase()) return;

        const confirmSwitch = confirm(`This will switch your plan to ${selectedPlan}. Proceed?`);
        if (!confirmSwitch) return;

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...currentUser,
                    plan: selectedPlan,
                    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                    status: 'active' // Set status to active when changing plan
                })
            });

            if (!response.ok) throw new Error('Failed to update plan');

            alert('Plan updated successfully!');
            await fetchUser();
            await loadPlans();
            // Update usage metrics after plan change
            updateUsageMetrics(selectedPlan);
        } catch (error) {
            console.error('Error updating plan:', error);
            alert('Error updating plan. Please try again.');
        }
    }

    // Handle account settings form submission
    accountSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(accountSettingsForm);
        const updates = {
            name: formData.get('name'),
            email: formData.get('email')
        };

        // Only update password if provided
        const newPassword = formData.get('password');
        if (newPassword) {
            updates.password = newPassword;
        }

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update account');

            alert('Account settings updated successfully!');
            await fetchUser();
        } catch (error) {
            console.error('Error updating account:', error);
            alert('Error updating account settings. Please try again.');
        }
    });

    // Handle account deletion
    deleteAccountBtn.addEventListener('click', async () => {
        const confirmDelete = confirm('Are you sure you want to permanently delete your account? This action cannot be undone.');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, { 
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete account');
            }

            localStorage.removeItem('loggedInUserEmail');
            alert('Account deleted successfully');
            window.location.href = '/register.html';
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account. Please try again.');
        }
    });

    // Handle plan renewal
    renewPlanBtn.addEventListener('click', async () => {
        const confirmRenew = confirm('Would you like to renew your current plan for another 30 days?');
        if (!confirmRenew) return;

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...currentUser,
                    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                    status: 'active' // Set status to active when renewing
                })
            });

            if (!response.ok) throw new Error('Failed to renew plan');

            alert('Plan renewed successfully!');
            await fetchUser();
        } catch (error) {
            console.error('Error renewing plan:', error);
            alert('Error renewing plan. Please try again.');
        }
    });

    // Helper functions
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function planPricing(plan) {
        if (plan === 'free') return '$0 <span class="plan-period">/ month</span>';
        if (plan === 'standard') return '$9.99 <span class="plan-period">/ month</span>';
        if (plan === 'premium') return '$19.99 <span class="plan-period">/ month</span>';
        return '';
    }

    function validatePrice(price) {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0 || numPrice > 999) {
            throw new Error('Price must be between 0 and 999');
        }
        return numPrice.toFixed(2);
    }

    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }
// RANDOM DATA GENERATION FOR USAGE METRICS (DONT WORRY ABOUT IT) :)
    // Update usage metrics based on plan
    function updateUsageMetrics(plan) {
        // Get plan price to determine limits
        const planPrice = getPlanPrice(plan);
        
        // Calculate storage and bandwidth limits based on price
        const storageLimit = Math.min(100, Math.floor(planPrice * 10)); // 10% of the plan price, max 100%
        const bandwidthLimit = Math.min(100, Math.floor(planPrice * 8)); // 8% of the plan price, max 100%
        
        // Generate random usage within limits
        const storageUsage = Math.floor(Math.random() * 100); // Random between 0-100
        const bandwidthUsage = Math.floor(Math.random() * 100); // Random between 0-100
        
        // Update storage usage
        document.getElementById('storage-usage').textContent = `${storageUsage}%`;
        document.getElementById('storage-progress').style.width = `${storageUsage}%`;
        
        // Update bandwidth usage
        document.getElementById('bandwidth-usage').textContent = `${bandwidthUsage}%`;
        document.getElementById('bandwidth-progress').style.width = `${bandwidthUsage}%`;
        
        // Generate random security stats
        const ddosAttacks = Math.floor(Math.random() * 50); // Random number of DDoS attacks (0-50)
        const malwareDetected = Math.floor(Math.random() * 30); // Random number of malware detections (0-30)
        
        // Update security stats
        document.getElementById('ddos-prevented').textContent = ddosAttacks;
        document.getElementById('ddos-value').textContent = ddosAttacks;
        document.getElementById('malware-detected').textContent = malwareDetected;
        document.getElementById('malware-value').textContent = malwareDetected;

        // Update usage metrics every 60 seconds
        setTimeout(() => updateUsageMetrics(plan), 60000);
    }

    function getPlanPrice(plan) {
        switch(plan.toLowerCase()) {
            case 'free':
                return 0;
            case 'standard':
                return 9.99;
            case 'premium':
                return 19.99;
            default:
                return 0;
        }
    }

    // Add event listener for plan renewal button
    const renewalBtn = document.getElementById('renew-plan-btn');
    if (renewalBtn) {
        renewalBtn.addEventListener('click', () => {
            document.getElementById('plans').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Initialize
    fetchUser();
    loadPlans();
});