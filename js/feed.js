document.addEventListener('DOMContentLoaded', function() {
    const spinnerWrapper = document.querySelector('.spinner-wrapper');

    // Function to fetch logged-in user information
    function fetchLoggedInUserInfo() {
        console.log('Fetching logged-in user info...');
        fetch('/api/get_user_info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin' // Send cookies
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user information');
            }
            return response.json();
        })
        .then(data => {
            // Update logged-in user fields
            const hiveUserName = document.getElementById('hive-logged-in-user-name');
            hiveUserName.textContent = data.userInfo.username;

            // Log user information to console
            console.log('Logged-in User:', data.userInfo.username);
            console.log('Logged-in User Email:', data.userInfo.email);
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });
    }

    // Event listener for window load event
    window.addEventListener('load', function() {
        showContent();
        fetchLoggedInUserInfo(); // Fetch logged-in user info on page load
    });
});