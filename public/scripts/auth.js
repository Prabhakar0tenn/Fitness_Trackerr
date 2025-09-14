// public/scripts/auth.js
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();

    if (!username) {
        alert('Please enter a username');
        return;
    }

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (response.ok) {
            const data = await response.json();
            // Save user object in localStorage
            localStorage.setItem('currentUser', JSON.stringify(data));
            // redirect to dashboard (we want to let user set goal there)
            window.location.href = 'dashboard.html';
        } else {
            const err = await response.json();
            alert(err.error || 'Error logging in. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error connecting to server. Please try again.');
    }
});
