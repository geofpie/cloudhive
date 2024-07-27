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

        fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
        })
        .catch(error => console.error('Error changing password:', error));
    });

    document.getElementById('changeEmailForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const newEmail = document.getElementById('newEmail').value;

        fetch('/api/change-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ newEmail })
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
        })
        .catch(error => console.error('Error changing email:', error));
    });
});

function fetchUserInfo() {
    fetch('/api/get_user_info', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('user-fullname').innerText = `${data.first_name} ${data.last_name}`;
        document.getElementById('user-username').innerText = `@${data.username}`;
        document.getElementById('user-email').innerText = data.email;
        document.querySelector('.user-info-card img').src = data.profile_picture_url;
        document.getElementById('hive-logged-in-user-name').innerText = `${data.first_name}`;
        document.getElementById('hive-logged-in-user-name').href = `/${data.username}`;
        document.querySelector('.navbar-profile-pic').src =`${data.profile_picture_url}`;
    })
    .catch(error => console.error('Error fetching user info:', error));
}


const notificationsModal = document.getElementById('notificationsModal');
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == notificationsModal) {
        notificationsModal.style.display = 'none';
    }
}