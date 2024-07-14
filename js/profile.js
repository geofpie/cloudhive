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

// Additional functionality for posting
document.addEventListener('DOMContentLoaded', (event) => {
    const openComposePostModalBtn = document.getElementById('write-post');
    const composePostModal = document.getElementById('composePostModal');
    const submitPostBtn = document.getElementById('submitPost');

    openComposePostModalBtn.addEventListener('click', () => {
        $(composePostModal).modal('show'); // Using jQuery to show Bootstrap modal
    });

    submitPostBtn.addEventListener('click', () => {
        const postContent = document.getElementById('postContent').value;
        const postImage = document.getElementById('postImage').files[0];

        const formData = new FormData();
        formData.append('userId', '<%= user.userId %>'); // Assuming user is authenticated
        formData.append('content', postContent);
        if (postImage) {
            formData.append('image', postImage);
        }

        // Log the formData before sending the request
        console.log('Data sent to backend:', formData);

        fetch('/api/posts', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create post');
            }
            return response.json();
        })
        .then(data => {
            console.log('Post created successfully:', data);
            $(composePostModal).modal('hide'); // Hide modal after successful post
            // Optionally reload posts or update UI
        })
        .catch(error => {
            console.error('Error creating post:', error);
            // Handle error or display message to user
        });
    });
});
