document.addEventListener('DOMContentLoaded', function() {
    console.log(localStorage.getItem('token'));
    fetchUserInfo();

    document.getElementById('changePasswordForm').addEventListener('submit', function(event) {
        event.preventDefault();
    
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match.');
            return;
        }
    
        fetch('/api/change_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message || 'Password changed successfully');
                window.location.reload();
            }
        })
        .catch(error => console.error('Error changing password:', error));
    });

    document.getElementById('changeEmailForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const newEmail = document.getElementById('newEmail').value;
    
        fetch('/api/change_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // No need to include Authorization header with Bearer token
            },
            body: JSON.stringify({ newEmail })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message || 'Email changed successfully');
                window.location.reload(); // Reload the page on successful update
            }
        })
        .catch(error => console.error('Error changing email:', error));
    });
});

function fetchUserInfo() {
    fetch('/api/get_user_info', {
        method: 'GET',
    })
    .then(response => {
        if (response.status === 401) {
            // Redirect to homepage if user is unauthorized
            window.location.href = '/';
            return; // Stop further processing
        }
        
        if (!response.ok) {
            throw new Error('Error fetching user info: ' + response.statusText);
        }
        
        return response.json();
    })
    .then(data => {
        if (data.redirect) {
            // Handle redirect instructions from the server
            window.location.href = data.redirect;
        } else {
            updateUserProfileFields(data.userInfo); // Call the separate function to update fields
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        // Optionally redirect to homepage on catch error
        window.location.href = '/';
    });
}

function updateUserProfileFields(user) {
    document.getElementById('user-fullname').innerText = `${user.first_name} ${user.last_name}`;
    document.getElementById('user-username').innerText = `@${user.username}`;
    document.getElementById('user-email').innerText = user.email;
    document.querySelector('.user-info-card img').src = user.profile_picture_url;
    document.getElementById('hive-logged-in-user-name').innerText = `${user.first_name}`;
    document.getElementById('hive-logged-in-user-name').href = `/${user.username}`;
    document.querySelector('.navbar-profile-pic').src = user.profile_picture_url;
    document.getElementById('hive-logged-in-dp').href = `/${user.username}`;
}

const notificationsModal = document.getElementById('notificationsModal');
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == notificationsModal) {
        notificationsModal.style.display = 'none';
    }
}

document.getElementById('notifications-link').addEventListener('click', function() {
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
