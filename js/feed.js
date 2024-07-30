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
    document.querySelector('.post-modal-profile-pic').src = user.profile_picture_url;
}

function fetchMutualFollowers() {
    fetch('/api/get_mutual_followers')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data); // Log the data received from the backend

            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';

            if (data.friendsList && Array.isArray(data.friendsList)) {
                data.friendsList.forEach(friend => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('list-group-item', 'd-flex', 'align-items-center');
                    listItem.innerHTML = `
                        <img src="${friend.profilepic_key ? getS3SignedUrl(friend.profilepic_key) : '../assets/default-profile.jpg'}" alt="Profile Picture" class="rounded-circle" width="40" height="40">
                        <div class="ml-3">
                            <h6>${friend.username}</h6>
                            <small class="${friend.status === 'Online' ? 'text-success' : friend.status === 'Away' ? 'text-warning' : 'text-muted'}">${friend.status}</small>
                            <br>
                            <small>Last online: ${friend.timeAgo}</small>
                        </div>
                    `;
                    friendsList.appendChild(listItem);
                });
            } else {
                console.log('No friends list found or it is not an array');
            }
        })
        .catch(error => {
            console.error('Error fetching mutual followers:', error);
        });
}

function getS3SignedUrl(key) {
    return `https://cloudhive-userdata.s3.amazonaws.com/${key}`;
}

dayjs.extend(dayjs_plugin_relativeTime);

document.addEventListener('DOMContentLoaded', function() {
    const postsContainer = document.getElementById('newsfeed-posts-container');
    const loadMoreButton = document.getElementById('load-more');
    const writePostButton = document.getElementById('write-post');
    const sharePostButton = document.getElementById('share-post');
    const picPostButton = document.getElementById('pic-post');
    const postModal = document.getElementById('postModal');
    const closeModalButtons = document.querySelectorAll('#closeModal, #closeModalFooter');
    const attachImageButton = document.getElementById('attachImageButton');
    const postImageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const submitPostButton = document.getElementById('submitPostButton');
    let isFetching = false;
    let lastTimestamp = null;
    const fetchedPostIds = new Set();

    fetchUserInfo();
    fetchMutualFollowers();

    function showModal() {
        postModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        postModal.classList.add('hidden');
        document.body.style.overflow = '';
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
        const postContent = document.getElementById('postContent');
        const postImage = postImageInput.files[0];
        
        if (postContent.value.trim() || postImage) {
            showSpinner(submitPostButton); // Show spinner during upload
            submitPost(postContent.value, postImage)
                .then(() => {
                    hideSpinner(submitPostButton); // Hide spinner after upload
                    postContent.value = ''; // Clear the text field
                    postImageInput.value = ''; // Clear the file input
                    document.getElementById('imagePreview').style.display = 'none'; // Hide image preview if needed
                })
                .catch((error) => {
                    console.error('Error uploading post:', error);
                    hideSpinner(submitPostButton); // Hide spinner if error occurs
                });
        } else {
            alert('Please enter content or attach an image.');
        }
    });

    function showSpinner(button) {
        // Store the original text of the button
        const originalText = button.innerHTML;
        
        // Add spinner and disable button
        button.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>';
        button.disabled = true;
        
        // Store original text for later use
        button.dataset.originalText = originalText;
    }
    
    function hideSpinner(button) {
        // Retrieve the original text from data attribute
        const originalText = button.dataset.originalText;
        
        // Restore original text and enable button
        button.innerHTML = originalText;
        button.disabled = false;
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
    
        return fetch('/api/create_post', { // Return the Promise from fetch
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
            hideModal(); // Hide modal after successful post
            refreshFeed(); // Clear current feed and fetch new posts
            return data; // Return data for chaining
        })
        .catch(error => {
            console.error('Error creating post:', error);
            throw error; // Re-throw the error for handling in the caller
        });
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

    function fetchPosts() {
        if (isFetching) return;
        isFetching = true;
    
        showSkeletonLoader();
    
        let url = '/api/newsfeed';
        if (lastTimestamp) {
            url += `?lastTimestamp=${encodeURIComponent(lastTimestamp)}`; // Encode URI component for safety
        }
    
        console.log('Fetching posts from URL:', url);
    
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched posts data:', data);
    
                if (!data.Items) {
                    console.error('No items in fetched data');
                    return;
                }
    
                const newPosts = data.Items.filter(post => !fetchedPostIds.has(post.postId));
    
                if (newPosts.length > 0) {
                    newPosts.forEach(post => {
                        fetchedPostIds.add(post.postId); // Add to set of fetched post IDs
    
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
                                    <a href="/${post.username}"><img src="${post.userProfilePicture || '../assets/default-profile.jpg'}" alt="Profile" class="post-profile-pic"></a>
                                </div>
                                <div class="col hive-user-details-text">
                                    <a href="/${post.username}" class="hive-post-username">${post.firstName}</a>
                                    <a href="/${post.username}" class="hive-post-user-sub">@${post.username}</a>
                                </div>
                                <div class="col hive-user-details-time">
                                    <i class="fa fa-clock hive-post-time-icon"></i>
                                    <p class="hive-post-time">${dayjs(post.postTimestamp).fromNow()}</p>
                                </div>
                            </div>
                            <div class="row hive-post-content">
                                <p class="hive-post-text">${post.content}</p>
                                ${post.imageUrl ? `<div class="hive-post-image shadow"><img class="hive-post-img-src" data-src="${post.imageUrl}" src="${post.imageUrl}" alt="Post Image"></div>` : ''}
                            </div>
                            <div class="hive-social-stats">
                                <p class="hive-stat-like"><strong>${post.likes || 0}</strong> likes</p>
                                <hr>
                                <div class="d-flex align-items-center">
                                    <button class="hive-stat-like-btn ${likeButtonClass}" data-post-id="${post.postId}">
                                        <img id="like-btn-hive" src="${likeButtonIcon}" alt="${likeButtonText}" style="width: 22px; height: 22px; vertical-align: middle;">
                                    </button>
                                    ${post.isUserPost ? `
                                        <div class="post-options">
                                            <button class="hive-stat-options-btn" onclick="toggleOptionsMenu(event)">
                                                <img id="options-btn-hive" src="assets/options.svg" alt="Options" style="width: 22px; height: 22px;">
                                            </button>
                                            <div class="options-menu">
                                                <ul>
                                                    <li><a href="#" class="delete-post" data-id="${post.postId}">Delete</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        `;
    
                        postElement.innerHTML = postTemplate;
                        document.getElementById('newsfeed-posts-container').appendChild(postElement);
                    });
    
                    // Update lastTimestamp for the next fetch
                    lastTimestamp = data.LastEvaluatedKey || null;
                    console.log('Updated lastTimestamp:', lastTimestamp);
    
                    // Show/hide load more button based on availability of more posts
                    loadMoreButton.style.display = lastTimestamp ? 'block' : 'none';
                } else {
                    // No new posts, or all posts have been fetched
                    loadMoreButton.style.display = 'none';
                }
    
                handleImageLoad();
    
                isFetching = false;
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
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
                const likeButton = postElement.querySelector('.hive-stat-like-btn');
                
                // Toggle the liked class based on response
                if (data.message === 'Like added') {
                    likeButton.classList.add('liked');
                    likeButtonIcon.src = '../assets/liked.svg'; // Change to liked icon
                } else {
                    likeButton.classList.remove('liked');
                    likeButtonIcon.src = '../assets/unliked.svg'; // Change to unliked icon
                }

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
});

document.querySelectorAll('.notifications-link').forEach(link => {
    link.addEventListener('click', function() {
        fetch('/api/follow-requests')
            .then(response => response.json())
            .then(data => {
                const followRequestsList = document.getElementById('follow-requests-list');
                followRequestsList.innerHTML = '';

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

function toggleOptionsMenu(event) {
    const button = event.currentTarget;
    const optionsMenu = button.nextElementSibling;

    // Hide any open options menus
    document.querySelectorAll('.options-menu').forEach(menu => {
        if (menu !== optionsMenu) {
            menu.style.display = 'none';
        }
    });

    // Toggle the visibility of the clicked options menu
    optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';

    // Prevent the click event from closing the menu immediately
    event.stopPropagation();
}

// Close the options menu if clicking outside of it
document.addEventListener('click', function(event) {
    const isClickInside = event.target.closest('.post-options');
    if (!isClickInside) {
        document.querySelectorAll('.options-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Attach event listener to the document
    document.addEventListener('click', function (event) {
        // Check if the clicked element is a delete button
        if (event.target && event.target.classList.contains('delete-post')) {
            event.preventDefault();

            // Confirm before deleting
            if (confirm('Are you sure you want to delete this post?')) {
                const postId = event.target.getAttribute('data-id');

                // Send delete request to the server
                fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Post and associated image deleted successfully.') {
                        // Remove the post element from the DOM
                        const postElement = document.querySelector(`.hive-post-element[data-post-id="${postId}"]`);
                        if (postElement) {
                            postElement.remove();
                        }
                        alert('Post deleted successfully.');
                    } else {
                        alert('Failed to delete the post: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the post.');
                });
            }
        }
    });
});