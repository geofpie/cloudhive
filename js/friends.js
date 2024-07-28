document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Set active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Display the correct tab content
            tabContents.forEach(content => {
                content.style.display = content.id === targetTab ? 'block' : 'none';
            });

            // Load the corresponding data
            loadFriends(targetTab);
        });
    });

    function loadFriends(tab) {
        console.log(`Fetching data for tab: ${tab}`); // Log which tab is being fetched

        fetch(`/api/${tab}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Data fetched for ${tab}:`, data); // Log the fetched data
                
                const container = document.getElementById(`${tab}-cards`);
                container.innerHTML = '';

                data.forEach(user => {
                    const card = document.createElement('div');
                    card.classList.add('friends-card');
                    card.innerHTML = `
                        <img src="${user.profile_picture_url || 'default-profile.png'}" alt="${user.username}'s profile picture">
                        <h3>${user.username}</h3>
                        <p>${user.first_name} ${user.last_name}</p>
                        <a href="/profile/${user.username}">View Profile</a>
                    `;
                    container.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error loading friends:', error);
                alert('Failed to load friends. Please try again later.');
            });
    }

    // Activate default tab and load corresponding data
    const defaultTab = 'following'; // Change to the default tab you want
    const defaultTabButton = document.querySelector(`.tab-button[data-tab="${defaultTab}"]`);
    if (defaultTabButton) {
        defaultTabButton.classList.add('active');
    }

    // Ensure the default tab content is visible
    tabContents.forEach(content => {
        content.style.display = content.id === defaultTab ? 'block' : 'none';
    });

    // Load the default tab's data
    loadFriends(defaultTab);
});