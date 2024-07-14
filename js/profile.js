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

const postFeed = document.getElementById('hive-feed-area');
let lastEvaluatedKey = null;
let loading = false;

const fetchPosts = (limit = 8, username) => {
    if (loading) return;
    loading = true;

    fetch('/api/get_posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
            limit: limit,
            lastEvaluatedKey: lastEvaluatedKey,
            username: username  // Ensure username is correctly passed
        })
    })
    .then(response => {
        console.log('Fetch posts response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Posts data:', data);
        lastEvaluatedKey = data.LastEvaluatedKey;
        renderPosts(data.Items);
        loading = false;
    })
    .catch(error => {
        console.error('Error fetching posts:', error);
        loading = false;
    });
};

const renderPosts = (posts) => {
    if (!postFeed) {
        console.error('Error: postFeed element is null or undefined');
        return;
    }

    postFeed.innerHTML = ''; // Clear existing posts

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('col-md-5', 'hive-post-element', 'mx-auto', 'shadow-sm');
        postElement.innerHTML = `
            <div class="row hive-post-user-details align-items-center">
                <div class="col">
                    <img src="${post.userProfilePicture || '../assets/default-profile.jpg'}" alt="Profile" class="post-profile-pic">
                </div>
                <div class="col hive-user-details-text">
                    <a href="/${post.username}" class="hive-post-username">${post.username}</a>
                    <a href="/${post.username}" class="hive-post-user-sub">@${post.username}</a>
                    <i class="fa fa-clock hive-post-time-icon"></i><p class="hive-post-time">${new Date(post.createdAt).toLocaleString()}</p>
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
        // Append postElement to postFeed
        postFeed.appendChild(postElement);
    });
};

// Fetch posts initially when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const currentUsername = getUsernameFromURL(); // Obtain the current username from URL
    fetchPosts(8, currentUsername); // Pass the currentUsername to fetchPosts
});

// Infinite scroll to load more posts
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        const currentUsername = getUsernameFromURL(); // Obtain the current username from URL
        fetchPosts(8, currentUsername); // Adjust limit and pass currentUsername
    }
});

// Lazy loading for images (if supported)
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('.lazyload');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                image.src = image.dataset.src;
                image.classList.remove('lazyload');
                imageObserver.unobserve(image);
            }
        });
    });

    lazyImages.forEach(image => {
        imageObserver.observe(image);
    });
} else {
    // Fallback for browsers without IntersectionObserver support
    const lazyImages = document.querySelectorAll('.lazyload');
    lazyImages.forEach(image => {
        image.src = image.dataset.src;
        image.classList.remove('lazyload');
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