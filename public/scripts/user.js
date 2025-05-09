// public/scripts/user.js

document.addEventListener('DOMContentLoaded', async () => {
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
        try {
            // Get user data from the server using the session
            const res = await fetch('/api/users/me');
            if (!res.ok) {
                if (res.status === 401) {
                    window.location.href = '/login';
                    return null;
                }
                throw new Error('Failed to fetch user data');
            }
            
            currentUser = await res.json();
            if (!currentUser) {
                window.location.href = '/login';
                return null;
            }

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
            
            return currentUser;
        } catch (error) {
            console.error('Error fetching user data:', error);
            window.location.href = '/login';
            return null;
        }
    }

    // Add event listeners to plan buttons
    function setupPlanButtons() {
        console.log('Setting up plan button event listeners');
        document.querySelectorAll('.plan-card-btn').forEach(btn => {
            btn.addEventListener('click', handlePlanChange);
        });
        console.log('Plan buttons setup complete');
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
            window.location.reload(); // Reload the page to reflect changes
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
            window.location.href = '/register';
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
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function planPricing(plan) {
        if (!plan) return '$0 <span class="plan-period">/ month</span>';
        
        const planLower = plan.toLowerCase();
        if (planLower === 'free') return '$0 <span class="plan-period">/ month</span>';
        if (planLower === 'standard') return '$9.99 <span class="plan-period">/ month</span>';
        if (planLower === 'premium') return '$19.99 <span class="plan-period">/ month</span>';
        
        // Default pricing based on plan name
        const price = getPlanPrice(planLower);
        return `$${price.toFixed(2)} <span class="plan-period">/ month</span>`;
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

    // Initialize the page
    try {
        console.log('Initializing user dashboard...');
        currentUser = await fetchUser();
        if (currentUser) {
            console.log('User data loaded, setting up plan buttons...');
            setupPlanButtons();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});