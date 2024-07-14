document.addEventListener('DOMContentLoaded', (event) => {
    fetchUserInfo();
});

function fetchUserInfo() {
    fetch('/api/get_user_info', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming you're using JWT tokens stored in localStorage
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        updateUserProfile(data.userInfo);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

function updateUserProfile(user) {
    document.getElementById('hive-logged-in-user-name').innerText = user.first_name + ' ' + user.last_name;
    document.querySelector('.navbar-profile-pic').src = user.profile_picture_url;
}

const editProfileModal = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');

document.querySelector('.profile-stat.hive-user-action').addEventListener('click', () => {
    // Populate form fields with current user data if needed
    $('#editProfileModal').modal('show');
});

// Handle Form Submission
editProfileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(editProfileForm);

    fetch('/api/update_profile', {
        method: 'POST',
        body: formData,
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token') // Add authorization if needed
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        return response.json();
    })
    .then(data => {
        console.log('Profile updated successfully:', data);
        $('#editProfileModal').modal('hide'); // Hide modal after successful update
        // Optionally update UI with new profile details
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        // Handle error or display message to user
    });
});