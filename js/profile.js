document.addEventListener('DOMContentLoaded', (event) => {
    fetchUserInfo();
});

const notificationsModal = document.getElementById('notificationsModal');
    
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == notificationsModal) {
        notificationsModal.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const writePostButton = document.getElementById('write-post');
    const sharePostButton = document.getElementById('share-post');
    const picPostButton = document.getElementById('pic-post');
    const postModal = document.getElementById('postModal');
    const closeModalButtons = document.querySelectorAll('#closeModal, #closeModalFooter');
    const attachImageButton = document.getElementById('attachImageButton');
    const postImageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const submitPostButton = document.getElementById('submitPostButton');
    const uploadIndicator = document.getElementById('uploadIndicator'); // Ensure this is correctly defined
    let lastTimestamp = null;
    const postsContainer = document.getElementById('hive-feed-area');
    const loadMoreButton = document.getElementById('load-more');
    let isFetching = false;
    const username = window.location.pathname.split('/').pop(); // Get the username from the URL
    const fetchedPostIds = new Set();
    let currentAction = null;
    let currentUsername = null;

    adjustTextColorBasedOnImage('.profile-fullwidth-header img');

    if (!uploadIndicator) {
        console.error('Upload indicator element not found');
        return;
    }

    function showModal() {
        postModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        postModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

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
            refreshFeed();
        })
        .catch(error => {
            console.error('Error creating post:', error);
            hideUploadIndicator(); // Hide spinner if there's an error
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
    
        let url = `/api/user/${username}/posts`;
        if (lastTimestamp) {
            url += `?lastTimestamp=${encodeURIComponent(lastTimestamp)}`;
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
                    // Filter out already fetched posts
                    const newPosts = data.Items.filter(post => !fetchedPostIds.has(post.postId));
    
                    newPosts.forEach(post => {
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
                        postsContainer.appendChild(postElement);
    
                        // Add post ID to fetched IDs
                        fetchedPostIds.add(post.postId);
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
    
                handleImageLoad(); // Ensure this function is defined and properly handles image loading
    
                isFetching = false;
                removeSkeletonLoader();
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                isFetching = false;
                removeSkeletonLoader();
            });
    }
    
    loadMoreButton.addEventListener('click', fetchPosts);
    
    // Initial fetch
    fetchPosts();
    
    function clearFeed() {
        document.getElementById('hive-feed-area').innerHTML = '';
        lastTimestamp = null;
        fetchedPostIds.clear(); // Optionally clear fetched post IDs
    }
    
    function refreshFeed() {
        clearFeed();
        fetchPosts();
    }

    // Infinite scroll
   window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isFetching && lastTimestamp) {
        fetchPosts();
    }
});

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

    writePostButton.addEventListener('click', showModal);
    sharePostButton.addEventListener('click', showModal);
    picPostButton.addEventListener('click', showModal);

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
                // Find the button by ID
                const button = document.getElementById(`follow-button-${username}`);
                if (button) {
                    // Update button text
                    button.innerHTML = '<i class="fa fa-clock uab"></i>Requested';
                    // Set data-status attribute to "requested"
                    button.setAttribute('data-status', 'requested');
                    // Remove onclick handler if necessary
                    button.removeAttribute('onclick');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error sending follow request');
        });
}

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

    const postModal = document.getElementById('postModal');
    window.onclick = function(event) {
        if (event.target == postModal) {
            postModal.classList.add('hidden');
        }
    }

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

dayjs.extend(dayjs_plugin_relativeTime);

// Get the modal and button
const modal = document.getElementById('editProfileModal');
const btn = document.getElementById('edit-profile');
const closeBtn = document.getElementById('closeEditProfileModal');

// Function to open the modal
function openEditProfileModal() {
    fetch('/api/get_user_info')
        .then(response => response.json())
        .then(data => {
            if (data.userInfo) {
                document.getElementById('firstName').value = data.userInfo.first_name;
                document.getElementById('lastName').value = data.userInfo.last_name;
                document.getElementById('username').value = data.userInfo.username;
                if (data.userInfo.profile_picture_url) {
                    document.getElementById('profilePicPreview').src = data.userInfo.profile_picture_url;
                    document.getElementById('profilePicPreview').style.display = 'block';
                }
                // Show the modal
                modal.style.display = 'block';
            } else {
                alert('Failed to load user information.');
            }
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
            alert('Failed to load user information.');
        });
}

// Function to close the modal
function closeEditProfileModal() {
    modal.style.display = 'none';
}

// Event listeners
btn.onclick = openEditProfileModal;
closeBtn.onclick = closeEditProfileModal;

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        closeEditProfileModal();
    }
};

// Initialize variables
let headerImageFile = null;

// Listen for header image file selection
document.getElementById('headerPicInput').addEventListener('change', function(e) {
    var files = e.target.files;
    if (files.length > 0) {
        headerImageFile = files[0];

        // Update preview
        var reader = new FileReader();
        reader.onload = function(event) {
            var headerPicPreview = document.getElementById('headerPicPreview');
            headerPicPreview.src = event.target.result;
            headerPicPreview.style.display = 'block'; // Show the preview
        };
        reader.readAsDataURL(headerImageFile);
    }
});

let profileImageFile = null; 

// Listen for form submit
document.getElementById('submitEditProfileButton').addEventListener('click', async function() {
    // Gather form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;

    // Prepare data for upload
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('username', username);

    // Handle header image upload if exists
    if (headerImageFile) {
        console.log(headerImageFile);
        const compressedBlob = await compressImage(headerImageFile);
        console.log(compressedBlob);
        formData.append('headerPic', compressedBlob, headerImageFile.name);
    }

    if (profileImageFile) {
        const compressedProfilePicBlob = await compressImage(profileImageFile);
        console.log(compressedProfilePicBlob);
        formData.append('profilePic', compressedProfilePicBlob, profileImageFile.name);
        console.log(formData);
    }

    // Send form data to backend (e.g., to update user profile)
    fetch('/api/update_profile', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Profile updated successfully:', data);
        alert('Profile updated successfully!');
        document.getElementById('editProfileModal').classList.add('hidden');
        window.location.reload();
    })
    .catch(error => {
        console.error('Error updating profile:', error);
    });
});

// Function to compress image using HTML5 canvas with target quality
function compressImage(file, targetQuality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Create canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas dimensions to the image dimensions
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                // Convert canvas to blob with target quality
                canvas.toBlob(function(blob) {
                    resolve(blob);
                }, 'image/jpeg', targetQuality); // Set quality parameter
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function getImageLightness(imageElement, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the image
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    // Get image data from canvas
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let r = 0, g = 0, b = 0;
    const length = frame.data.length / 4;
    
    for (let i = 0; i < length; i++) {
        r += frame.data[i * 4];
        g += frame.data[i * 4 + 1];
        b += frame.data[i * 4 + 2];
    }

    r = Math.floor(r / length);
    g = Math.floor(g / length);
    b = Math.floor(b / length);

    // Convert to HSL to get lightness
    const hsl = rgbToHsl(r, g, b);
    callback(hsl.l);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

function adjustTextColorBasedOnImage(imageSelector) {
    const imageElement = document.querySelector(imageSelector);
    if (imageElement) {
        getImageLightness(imageElement, function(lightness) {
            const textColor = lightness > 50 ? 'black' : 'white'; // Adjust threshold as needed
            document.querySelectorAll('.profile-user-name-elem, .profile-user-country').forEach(el => {
                el.style.color = textColor;
            });
        });
    }
}

// Function to show the modal
function showFollowActionsModal(action, username) {
    currentAction = action; // Set the current action
    currentUsername = username;

    const modal = document.getElementById('followActionsModal');
    const actionType = document.getElementById('followActionType');

    if (action === 'cancel') {
        actionType.textContent = 'cancel your follow request';
    } else if (action === 'unfollow') {
        actionType.textContent = 'unfollow this user';
    }

    modal.style.display = 'block'; // Show the modal
}

// Function to close the modal
function closeFollowActionsModal() {
    const modal = document.getElementById('followActionsModal');
    modal.style.display = 'none'; // Hide the modal
}

function handleModalConfirm() {
    if (currentAction === 'cancel') {
        cancelFollowRequest(currentUsername); // Call your cancel function
    } else if (currentAction === 'unfollow') {
        unfollowUser(currentUsername); // Call your unfollow function
    }
    closeFollowActionsModal(); // Close the modal after action
}

// Function to cancel follow request
function cancelFollowRequest(username) {
    fetch(`/api/cancel-follow/${username}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON response
        })
        .then(data => {
            alert(data.message); // Show the message from the JSON response

            // Find the button by ID using the username
            const button = document.getElementById(`follow-button-${username}`);
            if (button) {
                // Update button text
                button.innerHTML = '<i class="fa fa-user-plus uab"></i>Follow';

                // Update button attributes
                button.removeAttribute('data-status'); // Remove data-status if present
                button.setAttribute('onclick', `sendFollowRequest('${username}')`); // Set onclick to call sendFollowRequest
            } else {
                console.error('Button not found for username:', username);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error canceling follow request');
        });
}

// Function to handle unfollow request
function unfollowUser(username) {
    fetch(`/api/unfollow/${username}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON response
        })
        .then(data => {
            alert(data.message); // Show the message from the JSON response

            // Find the button by ID using the username
            const button = document.getElementById(`follow-button-${username}`);
            if (button) {
                // Update button text
                button.innerHTML = '<i class="fa fa-user-plus uab"></i>Follow';

                // Update button attributes
                button.removeAttribute('data-status'); // Remove data-status if present
                button.setAttribute('onclick', `sendFollowRequest('${username}')`); // Set onclick to call sendFollowRequest

                window.location.reload();
            } else {
                console.error('Button not found for username:', username);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error unfollowing user');
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const profilePicInput = document.getElementById('profilePicInput');
    const cropModal = document.getElementById('cropModal');
    const cropModalClose = cropModal.querySelector('.crop-modal-close');
    const cropSubmitBtn = document.getElementById('crop-submit-btn');
    const cropModelCancel = cropModal.querySelector('.crop-modal-cancel');
    let cropper;

    // Event listener for opening crop modal when profile pic input changes
    profilePicInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length === 0) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            // Destroy previous Cropper instance if it exists
            if (cropper) {
                cropper.destroy();
            }

            // Set the image source for the cropper and preview
            const image = document.getElementById('cropper-image');
            image.src = e.target.result;

            // Check if the image source is loaded
            image.onload = function() {
                // Initialize Cropper.js
                cropper = new Cropper(image, {
                    dragMode: 'move',
                    aspectRatio: 1 / 1,
                    viewMode: 2,
                    autoCropArea: 1,
                    restore: false,
                    guides: false,
                    center: false,
                    highlight: false,
                    background: false,
                    zoomable: true,
                    responsive: true,
                    cropBoxMovable: false,
                    cropBoxResizable: false,
                    toggleDragModeOnDblclick: false,
                    ready: function() {
                        console.log('Cropper.js initialized.');
                    }
                });

                // Show custom crop modal
                openCropModal();
            };

            // Log the loaded image source for debugging
            console.log('Image source set for cropping:', e.target.result);
        };
        reader.readAsDataURL(files[0]);
    });

        // Function to open the custom crop modal
        function openCropModal() {
            cropModal.style.display = 'block';
        }

        // Function to close the custom crop modal
        function closeCropModal() {
            cropModal.style.display = 'none';
        }

        // Event listener for the custom close button in the modal
        cropModalClose.addEventListener('click', closeCropModal);

        cropModelCancel.addEventListener('click', closeCropModal);

        window.onclick = function(event) {
            if (event.target == cropModal) {
                closeCropModal();
            }
        }

        // Event listener for the crop image button in the modal
        cropSubmitBtn.addEventListener('click', function() {
            if (cropper) {
                cropper.getCroppedCanvas({
                    width: 500, // Desired width
                    height: 500, // Desired height
                }).toBlob(function(blob) {
                    // Store the blob in a variable for later use
                    window.croppedImageBlob = blob;

                    // Create a URL for the cropped image
                    const croppedImageUrl = URL.createObjectURL(blob);

                    // Update the background image of the preview div
                    document.getElementById('profilePicPreview').src = `${croppedImageUrl}`;
                    profileImageFile = croppedImageBlob;
                    console.log(profileImageFile);

                    // Hide custom crop modal
                    closeCropModal();
                });
            }
        });    
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

$(document).ready(function() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
});
