// Cropper.js Setup
let cropper;

// Open Edit Profile Modal and Populate Fields
const editProfileModal = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const profilePictureInput = document.getElementById('profilePicture');
const profileHeaderInput = document.getElementById('profileHeader');
const profilePicturePreview = document.getElementById('profilePicturePreview');
const profileHeaderPreview = document.getElementById('profileHeaderPreview');
const cropperModal = document.getElementById('cropperModal');
const cropperImage = document.getElementById('cropperImage');
const cropImageBtn = document.getElementById('cropImageBtn');

document.addEventListener('DOMContentLoaded', (event) => {
    const writePostButton = document.getElementById('write-post');
    const writePostModal = new bootstrap.Modal(document.getElementById('writePostModal'));
    const attachImageButton = document.getElementById('attachImageButton');
    const postImageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const submitPostButton = document.getElementById('submitPostButton');

    writePostButton.addEventListener('click', () => {
        writePostModal.show();
    });

    attachImageButton.addEventListener('click', () => {
        postImageInput.click();
    });

    postImageInput.addEventListener('change', () => {
        const file = postImageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    submitPostButton.addEventListener('click', () => {
        const postContent = document.getElementById('postContent').value;
        const postImage = postImageInput.files[0];
        submitPost(postContent, postImage);
    });
});

function submitPost(content, imageFile) {
    const formData = new FormData();
    formData.append('content', content);
    if (imageFile) {
        formData.append('postImage', imageFile);
    }

    fetch('/api/create_post', {
        method: 'POST',
        body: formData,
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        return response.json();
    })
    .then(data => {
        console.log('Post created successfully:', data);
        // Optionally, update the UI with the new post
        writePostModal.modal('hide');
        fetchPosts(); // Fetch posts after new post creation
    })
    .catch(error => {
        console.error('Error creating post:', error);
        // Handle error or display message to user
    });
}

// Function to extract username from URL
function getUsernameFromURL() {
    // Get the current path from the URL
    const path = window.location.pathname;

    // Split the path by '/' and get the username part
    const pathParts = path.split('/');
    const username = pathParts[1]; // Assuming the username is the first part after the initial '/'

    console.log('username:', username);
    return username;
}

// Function to send follow request
function sendFollowRequest(username) {
    fetch(`/api/follow/${username}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            if (data.includes('already pending/')) {
                alert('You have already sent a follow request.');
            } else {
                alert(data); // Show success message
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error sending follow request');
        });
}

document.getElementById('notifications-link').addEventListener('click', function() {
    fetch('/api/follow-requests')
        .then(response => response.json())
        .then(data => {
            const followRequestsList = document.getElementById('follow-requests-list');
            followRequestsList.innerHTML = ''; // Clear the list

            data.forEach(request => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

                const profilePicUrl = request.profile_picture_url || '../assets/default-profile.jpg';

                listItem.innerHTML = `
                    <img src="${profilePicUrl}" alt="Profile Picture" class="rounded-circle" width="40" height="40">
                    <div>
                        <strong>${request.first_name} ${request.last_name}</strong>
                        <p>@${request.username}</p>
                    </div>
                    <div>
                        <button class="btn btn-success btn-sm mr-2" onclick="acceptFollowRequest('${request.username}')">Accept</button>
                        <button class="btn btn-danger btn-sm" onclick="denyFollowRequest('${request.username}')">Deny</button>
                    </div>
                `;

                followRequestsList.appendChild(listItem);
            });

            $('#notificationsModal').modal('show'); // Show the modal
        })
        .catch(error => console.error('Error fetching follow requests:', error));
});

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
        const listItem = document.querySelector(`li[data-username="${username}"]`);
        if (listItem) {
            listItem.remove(); // Remove the list item from the UI
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
        const listItem = document.querySelector(`li[data-username="${username}"]`);
        if (listItem) {
            listItem.remove(); // Remove the list item from the UI
        }
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('notifications-link').addEventListener('click', function() {
    fetch('/api/follow-requests')
        .then(response => response.json())
        .then(data => {
            const followRequestsList = document.getElementById('follow-requests-list');
            followRequestsList.innerHTML = ''; // Clear the list

            data.forEach(request => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.setAttribute('data-username', request.username);

                const profilePicUrl = request.profile_picture_url || '../assets/default-profile.jpg';

                listItem.innerHTML = `
                    <img src="${profilePicUrl}" alt="Profile Picture" class="rounded-circle" width="40" height="40">
                    <div>
                        <strong>${request.first_name} ${request.last_name}</strong>
                        <p>@${request.username}</p>
                    </div>
                    <div>
                        <button class="btn btn-success btn-sm mr-2" onclick="acceptFollowRequest('${request.username}')">Accept</button>
                        <button class="btn btn-danger btn-sm" onclick="denyFollowRequest('${request.username}')">Deny</button>
                    </div>
                `;

                followRequestsList.appendChild(listItem);
            });

            $('#notificationsModal').modal('show'); // Show the modal
        })
        .catch(error => console.error('Error fetching follow requests:', error));
});

document.addEventListener('DOMContentLoaded', function() {
    let lastPostId = null;
    const username = '<%= user.username %>'; // Pass the username dynamically
    const postsContainer = document.getElementById('profile-posts-container');
    const loadMoreButton = document.getElementById('load-more');

    function fetchPosts() {
        let url = `/api/user/${username}/posts`;
        if (lastPostId) {
            url += `?lastPostId=${lastPostId}`;
        }

        console.log('Fetching posts with URL:', url); // Log the URL

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you're using a token for auth
            }
        })
            .then(response => {
                console.log('Response status:', response.status); // Log response status
                if (response.status === 403) {
                    // User is not following the profile user
                    postsContainer.innerHTML = `
                        <div class="col-md-3 user-not-followed shadow mx-auto">
                            <i class="fa fa-user-plus followperson-icon"></i>
                            <h3 class="user-followed-header">Follow ${username} to view their posts, and get connected.</h3>
                        </div>
                    `;
                    loadMoreButton.style.display = 'none';
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (data.Items.length > 0) {
                    data.Items.forEach(post => {
                        const postElement = document.createElement('div');
                        postElement.className = 'hive-post';

                        const postTemplate = `
                            <div class="row hive-post-user-details align-items-center">
                                <div class="col">
                                    <img src="${post.userProfilePicture || '../assets/default-profile.jpg'}" alt="Profile" class="post-profile-pic">
                                </div>
                                <div class="col hive-user-details-text">
                                    <a href="/${post.username}" class="hive-post-username">${post.username}</a>
                                    <a href="/${post.username}" class="hive-post-user-sub">@${post.username}</a>
                                    <i class="fa fa-clock hive-post-time-icon"></i><p class="hive-post-time">${new Date(post.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <div class="row hive-post-content">
                                <p class="hive-post-text">${post.content}</p>
                                ${post.imageUrl ? `<div class="hive-post-image"><img class="hive-post-img-src lazyload" data-src="${post.imageUrl}" src="placeholder.jpg" alt="Post Image"></div>` : ''}
                            </div>
                            <div class="hive-social-stats">
                                <p class="hive-stat-like"><strong>${post.likes || 0}</strong> likes</p>
                                <hr>
                                <button class="hive-stat-like-btn"><i class="fa fa-heart hive-stat-like-heart"></i>Like</button>
                            </div>
                        `;

                        postElement.innerHTML = postTemplate;
                        postsContainer.appendChild(postElement);
                    });

                    // Update lastPostId for next fetch
                    lastPostId = data.LastEvaluatedKey ? data.LastEvaluatedKey.postId : null;
                    console.log('Updated lastPostId:', lastPostId); // Log updated lastPostId

                    if (lastPostId) {
                        loadMoreButton.style.display = 'block';
                    } else {
                        loadMoreButton.style.display = 'none';
                    }
                } else {
                    loadMoreButton.style.display = 'none';
                }
            })
            .catch(error => console.error('Error fetching posts:', error));
    }

    loadMoreButton.addEventListener('click', fetchPosts);

    // Initial fetch
    fetchPosts();

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            if (lastPostId) {
                fetchPosts();
            }
        }
    });
});
