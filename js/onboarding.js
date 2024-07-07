document.addEventListener('DOMContentLoaded', function() {
    const token = getTokenFromCookie(); // Function to get the token from cookies, adjust as needed
    
    fetchUserInfo(token);
});

function fetchUserInfo(token) {
    fetch('/api/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('username').innerText = data.username;
        document.getElementById('email').innerText = data.email;
    })
    .catch(error => {
        console.error('Error fetching user information:', error);
        // Handle error
    });
}

function getTokenFromCookie() {
    // Implement your logic to retrieve the token from cookies
    // For example, using a function to parse document.cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        if (name === 'token') {
            return parts[1];
        }
    }
    return null; // Token not found
}
