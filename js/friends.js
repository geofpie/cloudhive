function fetchUserInfo() {
    fetch('/api/get_user_info', {
        method: 'GET',
        credentials: 'include',
    })
    .then(response => {
        if (response.status === 401) {
            // Redirect to homepage if user is unauthorised
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            window.location.href = '/';
            return; // Stop further processing
        }
        
        if (!response.ok) {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            throw new Error('Generic error ' + response.statusText);
        }
        
        return response.json();
    })
    .then(data => {
        if (data.redirect) {
            // Handle any additional redirect instructions from the server
            window.location.href = data.redirect;
        } else {
            updateUserProfile(data.userInfo);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}
function updateUserProfile(user) {
    const loggedInUserPic = document.getElementById('hive-logged-in-dp');
    const loggedInUserPicMob = document.getElementById('hive-logged-in-dp-mob');
    const username = user.username;

    loggedInUserPic.href = `/${username}`;
    loggedInUserPicMob.href = `/${username}`;

    document.querySelector('.navbar-profile-pic').src = user.profile_picture_url;
    document.querySelector('.postbar-profile-pic').src = user.profile_picture_url;
    document.querySelector('.navbar-profile-pic-mob').src = user.profile_picture_url;
}


document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    fetchUserInfo();

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
    
                data.forEach((user, index) => {
                    const card = document.createElement('div');
                    card.classList.add('friends-card');
                    card.style.animationDelay = `${index * 0.1}s`; // Staggered delay based on index
                    card.innerHTML = `
                        <img src="${user.profile_picture_url || 'default-profile.png'}" alt="${user.username}'s profile picture">
                        <h3 class="friends-card-header">${user.first_name} ${user.last_name}</h3>
                        <p>@${user.username}</p>
                        <a class="friends-card-btn" href="/${user.username}">View Profile</a>
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

document.querySelectorAll('.notifications-link').forEach(link => {
    link.addEventListener('click', function() {
        fetch('/api/follow-requests')
            .then(response => response.json())
            .then(data => {
                const followRequestsList = document.getElementById('follow-requests-list');
                followRequestsList.innerHTML = ''; // Clear the list

                data.forEach(request => {
                    const listItem = document.createElement('li');
                    listItem.className = 'notifications-list-group-item';

                    const profilePicUrl = request.profile_picture_url || '../assets/default-profile.jpg';

                    listItem.innerHTML = `
                        <div class="follow-container" data-username="${request.username}">
                            <div class="request-profile-pic">
                                <img src="${profilePicUrl}" alt="Profile Picture" class="rounded-circle" width="40" height="40">
                            </div>
                            <div class="follow-details">
                                <strong>${request.first_name} ${request.last_name}</strong>
                                <p>@${request.username}</p>
                            </div>
                            <div class="follow-actions">
                                <button class="follow-btn-action accept" onclick="acceptFollowRequest('${request.username}')"><img src="assets/accept.svg" width="28" height="28"></button>
                                <button class="follow-btn-action deny" onclick="denyFollowRequest('${request.username}')"><img src="assets/deny.svg" width="28" height="28"></button>
                            </div>
                        </div>
                    `;

                    followRequestsList.appendChild(listItem);
                });

                openNotificationsModal();
            })
            .catch(error => console.error('Error fetching follow requests:', error));
    });
});


function openNotificationsModal() {
    document.getElementById('notificationsModal').style.display = 'block';
}

function closeNotificationsModal() {
    document.getElementById('notificationsModal').style.display = 'none';
}

function acceptFollowRequest(username) {
    fetch('/api/follow-requests/accept', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        // Remove the request from the list or update the UI to show it as accepted
        const followItem = document.querySelector(`.follow-container[data-username="${username}"]`);
        if (followItem) {
            followItem.remove(); // Remove the follow request from the UI
        }
    })
    .catch(error => console.error('Error:', error));
}

function denyFollowRequest(username) {
    fetch('/api/follow-requests/deny', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        // Remove the request from the list
        const followItem = document.querySelector(`.follow-container[data-username="${username}"]`);
        if (followItem) {
            followItem.remove(); // Remove the follow request from the UI
        }
    })
    .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');

    images.forEach(image => {
        // Add the initial hidden class
        image.classList.add('image-hidden');

        // Add an event listener for the load event
        image.addEventListener('load', () => {
            // When the image is fully loaded, switch classes
            image.classList.remove('image-hidden');
            image.classList.add('image-visible');
        });

        // For cached images (if the image is already loaded)
        if (image.complete) {
            image.classList.remove('image-hidden');
            image.classList.add('image-visible');
        }
    });

    const notificationsModal = document.getElementById('notificationsModal');
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == notificationsModal) {
            notificationsModal.style.display = 'none';
        }
    }

    const postModal = document.getElementById('postModal');
    window.onclick = function(event) {
        if (event.target == postModal) {
            postModal.classList.add('hidden');
        }
    }
});

$(document).ready(function() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
});
