document.addEventListener('DOMContentLoaded', (event) => {
    const writePostButton = document.getElementById('write-post');
    const sharePostButton = document.getElementById('share-post');
    const picPostButton = document.getElementById('pic-post');
    const customModal = document.getElementById('postModal');
    const closeModalButtons = document.querySelectorAll('#closeModal, #closeModalFooter');
    const attachImageButton = document.getElementById('attachImageButton');
    const postImageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const submitPostButton = document.getElementById('submitPostButton');
    const uploadIndicator = document.getElementById('uploadIndicator'); // Ensure this is correctly defined

    if (!uploadIndicator) {
        console.error('Upload indicator element not found');
        return;
    }

    function showModal() {
        customModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function hideModal() {
        customModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore background scroll
    }

    writePostButton.addEventListener('click', showModal);
    sharePostButton.addEventListener('click', showModal);
    picPostButton.addEventListener('click', showModal);

    closeModalButtons.forEach(button => {
        button.addEventListener('click', hideModal);
    });

    attachImageButton.addEventListener('click', () => {
        postImageInput.click();
    });

    postImageInput.addEventListener('change', async () => {
        const file = postImageInput.files[0];
        if (file) {
            const resizedFile = await resizeImage(file);
            console.log('Original file size:', file.size); // Log the original file size
            console.log('Resized file size:', resizedFile.size); // Log the resized file size

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(resizedFile);

            // Update the file input to use the resized file
            // Workaround for updating file input value
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(resizedFile);
            postImageInput.files = dataTransfer.files;
        }
    });

    submitPostButton.addEventListener('click', () => {
        const postContent = document.getElementById('postContent').value;
        const postImage = postImageInput.files[0];
        if (postContent.trim() || postImage) {
            showUploadIndicator(); // Show spinner during upload
            submitPost(postContent, postImage);
        } else {
            alert('Please enter content or attach an image.');
        }
    });

    function showUploadIndicator() {
        if (uploadIndicator) {
            uploadIndicator.classList.remove('hidden');
            document.querySelector('.post-modal-content').classList.add('disabled'); // Disable form
        } else {
            console.error('Upload indicator element not found');
        }
    }

    function hideUploadIndicator() {
        if (uploadIndicator) {
            uploadIndicator.classList.add('hidden');
            document.querySelector('.post-modal-content').classList.remove('disabled'); // Enable form
        } else {
            console.error('Upload indicator element not found');
        }
    }

    async function resizeImage(file) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        // Ensure image is loaded before processing
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 800; // Desired width
        const scaleFactor = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleFactor;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress the image and get it as a Blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                console.log('Original file size:', file.size); // Log original file size
                console.log('Compressed file size:', blob.size); // Log compressed file size
                resolve(new File([blob], file.name, { type: file.type }));
            }, 'image/jpeg', 0.6); // Adjust quality (0.6 for 60% quality)
        });
    }

    function submitPost(content, imageFile) {
        const formData = new FormData();
        formData.append('content', content);
        if (imageFile) {
            formData.append('postImage', imageFile);
        }

        console.log('Submitting FormData:', formData);
        console.log('Image File in FormData:', formData.get('postImage'));

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
            hideUploadIndicator(); // Hide spinner after upload
            hideModal(); // Hide modal after successful post
            fetchPosts(); // Fetch posts after new post creation
        })
        .catch(error => {
            console.error('Error creating post:', error);
            hideUploadIndicator(); // Hide spinner if there's an error
        });
    }
});

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
    const loggedInUserName = document.getElementById('hive-logged-in-user-name');
    const username = user.username;

    loggedInUserName.innerText = user.first_name;
    loggedInUserName.href = `/${username}`; 

    document.querySelector('.navbar-profile-pic').src = user.profile_picture_url;
}

function showSkeletonLoader() {
    for (let i = 0; i < 3; i++) { // Adjust the number of skeleton loaders as needed
        const skeletonElement = document.createElement('div');
        skeletonElement.className = 'col-md-4 hive-post-element hive-post-skeleton mx-auto';
        skeletonElement.innerHTML = `
            <div class="row hive-post-user-details hive-post-details-skeleton align-items-center">
                <div class="col hive-pfp-skeleton"></div>
                <div class="col hive-user-details-text">
                    <div class="hive-user-acc-deets"></div>
                </div>
            </div>
            <div class="row hive-post-content hive-post-content-skeleton">
                <div class="hive-post-image-skelly shadow"></div>
            </div>
            <div class="hive-social-stats">
                <div class="hive-stat-skelly"></div>
                <hr class="divider-skelly">
                <div class="hive-like-btn-skeleton"></div>
            </div>
        `;
        postsContainer.appendChild(skeletonElement);
    }
}

function removeSkeletonLoader() {
    const skeletons = document.querySelectorAll('.hive-post-skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
}

function handleImageLoad() {
    const images = postsContainer.querySelectorAll('.hive-post-img-src');
    let loadedImagesCount = 0;

    images.forEach(image => {
        if (image.complete) {
            loadedImagesCount++;
        } else {
            image.addEventListener('load', () => {
                loadedImagesCount++;
                if (loadedImagesCount === images.length) {
                    removeSkeletonLoader();
                }
            });
            image.addEventListener('error', () => {
                loadedImagesCount++;
                if (loadedImagesCount === images.length) {
                    removeSkeletonLoader();
                }
            });
        }
    });

    if (loadedImagesCount === images.length) {
        removeSkeletonLoader();
    }
}

dayjs.extend(dayjs_plugin_relativeTime);

document.addEventListener('DOMContentLoaded', function() {
    let lastPostTimestamp = null;
    const postsContainer = document.getElementById('hive-feed-area');
    const loadMoreButton = document.getElementById('load-more');
    let isFetching = false;
    const username = window.location.pathname.split('/').pop(); // Get the username from the URL

    function fetchPosts() {
        if (isFetching) return;
        isFetching = true;

        let url = `/api/user/${username}/posts`;
        if (lastPostTimestamp) {
            url += `?lastPostTimestamp=${lastPostTimestamp}`;
        }

        console.log('Fetching posts from URL:', url);

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched posts data:', data);

                if (!data.Items) {
                    console.error('No items in fetched data');
                    return;
                }

                if (data.Items.length > 0) {
                    data.Items.forEach(post => {
                        console.log('Post data:', post);

                        // Determine if the post is liked by the current user
                        const isLiked = post.isLiked; // Ensure `isLiked` is provided by the backend

                        // Update button appearance based on the `isLiked` status
                        const likeButtonIcon = isLiked ? '../assets/liked.svg' : '../assets/unliked.svg';
                        const likeButtonText = isLiked ? 'Liked' : 'Like';
                        const likeButtonClass = isLiked ? 'liked' : '';

                        const postElement = document.createElement('div');
                        postElement.className = 'hive-post';

                        const postTemplate = `
                        <div class="col-md-4 hive-post-element mx-auto" data-post-id="${post.postId}">
                            <div class="row hive-post-user-details align-items-center">
                                <div class="hive-post-pfp">
                                    <img src="${post.userProfilePicture || '../assets/default-profile.jpg'}" alt="Profile" class="post-profile-pic">
                                </div>
                                <div class="col hive-user-details-text">
                                    <a href="/${post.username}" class="hive-post-username">${post.firstName}</a>
                                    <a href="/${post.username}" class="hive-post-user-sub">@${post.username}</a>
                                </div>
                                <div class="col hive-user-details-time">
                                    <i class="fa fa-clock hive-post-time-icon"></i><p class="hive-post-time">${dayjs(post.postTimestamp).fromNow()}</p>
                                </div>
                            </div>
                            <div class="row hive-post-content">
                                <p class="hive-post-text">${post.content}</p>
                                ${post.imageUrl ? `<div class="hive-post-image shadow"><img class="hive-post-img-src" data-src="${post.imageUrl}" src="${post.imageUrl}" alt="Post Image"></div>` : ''}
                            </div>
                            <div class="hive-social-stats">
                                <p class="hive-stat-like"><strong>${post.likes || 0}</strong> likes</p>
                                <hr>
                                <button class="hive-stat-like-btn ${likeButtonClass}" data-post-id="${post.postId}">
                                    <img id="like-btn-hive" src="${likeButtonIcon}" alt="${likeButtonText}" style="width: 22px; height: 22px; vertical-align: middle;">
                                </button>
                            </div>
                        </div>
                        `;

                        postElement.innerHTML = postTemplate;
                        postsContainer.appendChild(postElement);
                    });

                    // Update lastPostTimestamp for next fetch
                    lastPostTimestamp = data.LastEvaluatedKey;

                    if (lastPostTimestamp) {
                        loadMoreButton.style.display = 'block';
                    } else {
                        loadMoreButton.style.display = 'none';
                    }
                } else {
                    loadMoreButton.style.display = 'none';
                }
            })
            .catch(error => console.error('Error fetching posts:', error))
            .finally(() => {
                isFetching = false;
            });
    }


    loadMoreButton.addEventListener('click', fetchPosts);

    // Initial fetch
    fetchPosts();

    function clearFeed() {
        document.getElementById('newsfeed-posts-container').innerHTML = '';
        lastTimestamp = null;
        fetchedPostIds.clear(); // Optionally clear fetched post IDs
    }
    
    function refreshFeed() {
        clearFeed();
        fetchPosts();
    }

    // Event delegation to handle clicks on dynamically added like buttons
    postsContainer.addEventListener('click', function(event) {
        if (event.target.closest('.hive-stat-like-btn')) {
            const likeButton = event.target.closest('.hive-stat-like-btn');
            const postId = likeButton.dataset.postId;

            console.log('Like button clicked for post ID:', postId);

            fetch(`/api/like/${postId}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to like/unlike post');
                }
                return response.json();
            })
            .then(data => {
                console.log('Post like/unlike successful:', data);

                // Correctly target the like button icon and like count for the specific post
                const postElement = document.querySelector(`.hive-post-element[data-post-id="${postId}"]`);
                const likeButtonIcon = postElement.querySelector(`#like-btn-hive`);
                const likeButtonIconSrc = data.message === 'Like added' ? '../assets/liked.svg' : '../assets/unliked.svg';
                likeButtonIcon.src = likeButtonIconSrc;

                // Update like count
                const likeCountElement = postElement.querySelector('.hive-stat-like strong');
                if (likeCountElement) {
                    likeCountElement.textContent = data.likes || 0;
                }
            })
            .catch(error => {
                console.error('Error liking/unliking post:', error);
            });
        }
    });

    // Infinite scroll
   /* window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isFetching && lastPostTimestamp) {
            fetchPosts();
        }
    }); */
});

document.getElementById('profilePicInput').addEventListener('change', handleProfilePicChange);
document.getElementById('headerPicInput').addEventListener('change', handleHeaderPicChange);
document.getElementById('submitEditProfileButton').addEventListener('click', submitEditProfile);
const editProfileButton = document.querySelector('.profile-stat.hive-user-action');
const editProfileModal = document.getElementById('editProfileModal');
const closeModalButton = document.getElementById('closeModal');

// Show the modal
editProfileButton.addEventListener('click', () => {
    editProfileModal.classList.remove('hidden');
});

// Close the modal
closeModalButton.addEventListener('click', () => {
    editProfileModal.classList.add('hidden');
});

let profilePicCropper, headerPicCropper;

function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = function() {
                document.getElementById('profilePicPreview').src = image.src;
                document.getElementById('profilePicPreview').style.display = 'block';
                initializeCropper(image, 'profilePic');
            };
        };
        reader.readAsDataURL(file);
    }
}

function handleHeaderPicChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = function() {
                document.getElementById('headerPicPreview').src = image.src;
                document.getElementById('headerPicPreview').style.display = 'block';
                initializeCropper(image, 'headerPic');
            };
        };
        reader.readAsDataURL(file);
    }
}

function initializeCropper(image, type) {
    const cropperContainer = document.createElement('div');
    document.body.appendChild(cropperContainer);
    const cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        ready: function () {
            cropperContainer.style.display = 'none';
        }
    });

    if (type === 'profilePic') {
        profilePicCropper = cropper;
    } else {
        headerPicCropper = cropper;
    }
}

function submitEditProfile() {
    const formData = new FormData();
    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('username', document.getElementById('username').value);
    formData.append('email', document.getElementById('email').value);

    if (profilePicCropper) {
        profilePicCropper.getCroppedCanvas().toBlob(function(blob) {
            formData.append('profilePic', blob, 'profile-pic.png');
            uploadProfileData(formData);
        });
    } else {
        uploadProfileData(formData);
    }

    if (headerPicCropper) {
        headerPicCropper.getCroppedCanvas().toBlob(function(blob) {
            formData.append('headerPic', blob, 'header-pic.png');
            uploadProfileData(formData);
        });
    } else {
        uploadProfileData(formData);
    }
}

function uploadProfileData(formData) {
    fetch('/api/user/updateProfile', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Profile updated:', data);
        document.getElementById('editProfileModal').classList.add('hidden');
        // Optionally reload the profile page or update the UI
    })
    .catch(error => console.error('Error updating profile:', error));
}