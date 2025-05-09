document.addEventListener("DOMContentLoaded", function () {
    // Modal elements
    const modal = document.getElementById('editPlanModal');
    const closeBtn = document.querySelector('.close');
    const editForm = document.getElementById('edit-plan-form');

    // Close modal when clicking the X
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    async function loadPlansToTable() {
        try {
            const res = await fetch('/api/plans');
            const plans = await res.json();
            const tbody = document.querySelector('.existing-plans tbody');
            tbody.innerHTML = '';

            plans.forEach(plan => {
                const row = document.createElement('tr');
                row.innerHTML =
                    '<td>' + plan.name + '</td>' +
                    '<td>$' + parseFloat(plan.price).toFixed(2) + '</td>' +
                    '<td>' + plan.description + '</td>' +
                    '<td>' +
                    '<button class="edit-btn" data-id="' + plan.id + '">Edit</button>' +
                    '<button class="delete-btn" data-id="' + plan.id + '">Delete</button>' +
                    '</td>';
                tbody.appendChild(row);
            });

            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    const plan = plans.find(p => p.id == id);
                    if (plan) {
                        // Fill the edit form with plan data
                        document.getElementById('edit-plan-id').value = plan.id;
                        document.getElementById('edit-plan-name').value = plan.name;
                        document.getElementById('edit-plan-price').value = plan.price;
                        document.getElementById('edit-plan-description').value = plan.description;
                        document.getElementById('edit-plan-type').value = plan.type || 'standard';
                        
                        // Show the modal
                        modal.style.display = "block";
                    }
                });
            });

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    if (confirm('Delete this plan?')) {
                        const res = await fetch('/api/plans/' + id, { method: 'DELETE' });
                        if (res.ok) {
                            loadPlansToTable();
                        } else {
                            alert('Failed to delete.');
                        }
                    }
                });
            });
        } catch (err) {
            console.error('Failed to load plans:', err);
        }
    }

    // Handle edit form submission
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const planId = document.getElementById('edit-plan-id').value;
        const formData = new FormData(editForm);
        const planData = {
            name: formData.get('name'),
            price: formData.get('price'),
            description: formData.get('description'),
            type: formData.get('type')
        };

        try {
            // Validate price
            const price = parseFloat(planData.price);
            if (isNaN(price) || price < 0 || price > 999) {
                alert('Price must be between 0 and 999');
                return;
            }

            // Validate plan type
            if (!['free', 'standard', 'premium'].includes(planData.type)) {
                alert('Invalid plan type selected');
                return;
            }

            const response = await fetch('/api/plans/' + planId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(planData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update plan');
            }

            alert('Plan updated successfully!');
            modal.style.display = "none";
            loadPlansToTable();
        } catch (error) {
            console.error('Error updating plan:', error);
            alert(error.message || 'Error updating plan. Please try again.');
        }
    });

    const form = document.getElementById('plan-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const planData = {
                name: formData.get('name'),
                price: formData.get('price'),
                description: formData.get('description'),
                type: formData.get('type')
            };

            try {
                // Validate price
                const price = parseFloat(planData.price);
                if (isNaN(price) || price < 0 || price > 999) {
                    alert('Price must be between 0 and 999');
                    return;
                }

                // Validate plan type
                if (!['free', 'standard', 'premium'].includes(planData.type)) {
                    alert('Invalid plan type selected');
                    return;
                }

                const response = await fetch('/api/plans', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(planData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to add plan');
                }

                alert('Plan added successfully!');
                form.reset();
                loadPlansToTable();
            } catch (error) {
                console.error('Error adding plan:', error);
                alert(error.message || 'Error adding plan. Please try again.');
            }
        });
    }

    loadPlansToTable();
});
  