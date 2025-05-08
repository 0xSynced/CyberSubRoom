document.addEventListener('DOMContentLoaded', () => {
    loadFeedbacks();

    // Add event listener for delete buttons using event delegation
    document.getElementById('feedbackTableBody').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const feedbackId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this feedback?')) {
                await deleteFeedback(feedbackId);
            }
        }
    });
});

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

async function loadFeedbacks() {
    try {
        const response = await fetch('/api/feedback');
        const feedbacks = await response.json();
        
        const tableBody = document.getElementById('feedbackTableBody');
        tableBody.innerHTML = '';

        feedbacks.forEach(feedback => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${feedback.name}</td>
                <td>${feedback.email}</td>
                <td>${feedback.subject || 'General Feedback'}</td>
                <td>${feedback.message}</td>
                <td>${formatDate(feedback.createdAt)}</td>
                <td>
                    <button class="delete-btn" data-id="${feedback.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading feedbacks:', error);
        alert('Failed to load feedbacks. Please try again.');
    }
}

async function deleteFeedback(id) {
    try {
        const response = await fetch(`/api/feedback/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Reload the feedbacks after successful deletion
            loadFeedbacks();
        } else {
            throw new Error('Failed to delete feedback');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        alert('Failed to delete feedback. Please try again.');
    }
} 