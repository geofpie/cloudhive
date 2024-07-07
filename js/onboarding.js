document.addEventListener('DOMContentLoaded', function() {
    // Retrieving token from cookie
    const token = getCookie('token');

    // Fetch user information using the token
    fetch('/api/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        // Update user information on the page
        document.getElementById('username').innerText = data.username;
        document.getElementById('email').innerText = data.email;
    })
    .catch(error => {
        console.error('Error fetching user information:', error);
        // Handle error
    });

    // Function to get cookie by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});
