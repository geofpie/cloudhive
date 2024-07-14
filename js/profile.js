document.addEventListener('DOMContentLoaded', (event) => {
    const writePostButton = document.getElementById('write-post');
    const customModal = document.getElementById('customModal');
    const closeButton = document.querySelector('.close-btn');
    const addImageButton = document.getElementById('addImageButton');
    const postImageContainer = document.getElementById('postImageContainer');
    const submitPostButton = document.getElementById('submitPostButton');

    writePostButton.addEventListener('click', () => {
        customModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        customModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === customModal) {
            customModal.style.display = 'none';
        }
    });

    addImageButton.addEventListener('click', () => {
        postImageContainer.style.display = 'block';
    });

    submitPostButton.addEventListener('click', handlePostCreation);

    // Fetch user info
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
    document.getElementById('hive-logged-in-user-name').innerText = user.username;
    document.querySelector('.navbar-profile-pic').src = user.profile_picture_url;
}

function handlePostCreation() {
    const content = document.getElementById('postContent').value;
    const postImageInput = document.getElementById('postImage');
    const file = postImageInput.files[0];

    const formData = new FormData();
    formData.append('content', content);
    if (file) {
        formData.append('postImage', file);
    }

    fetch('/api/create_post', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Post created successfully:', data);
        // Hide the modal after successful post creation
        document.getElementById('customModal').style.display = 'none';
    })
    .catch(error => {
        console.error('Error creating post:', error);
    });
}
