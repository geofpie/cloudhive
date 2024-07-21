function fetchUserInfo() {
    fetch('/api/get_user_info', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/';
            return;
        }
        if (!response.ok) {
            throw new Error('Generic error ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            updateUserProfile(data.userInfo);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        window.location.href = '/';
    });
}

function updateUserProfile(user) {
    const loggedInUserName = document.getElementById('hive-logged-in-user-name');
    const username = user.username;
    loggedInUserName.innerText = user.first_name;
    loggedInUserName.href = `/${username}`; 

    document.querySelector('.navbar-profile-pic').src = user.profile_picture_url;
    document.querySelector('.postbar-profile-pic').src = user.profile_picture_url;
}

dayjs.extend(dayjs_plugin_relativeTime);

document.addEventListener('DOMContentLoaded', function() {
    const postsContainer = document.getElementById('newsfeed-posts-container');
    const loadMoreButton = document.getElementById('load-more');
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
    let isFetching = false;
    let lastTimestamp = null;
    const fetchedPostIds = new Set();

    fetchUserInfo();

    if (!uploadIndicator) {
        console.error('Upload indicator element not found');
        return;
    }

    function showModal() {
        customModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        customModal.classList.add('hidden');
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
            console.log('Original file size:', file.size);
            console.log('Resized file size:', resizedFile.size);

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(resizedFile);

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(resizedFile);
            postImageInput.files = dataTransfer.files;
        }
    });

    submitPostButton.addEventListener('click', () => {
        const postContent = document.getElementById('postContent').value;
        const postImage = postImageInput.files[0];
        if (postContent.trim() || postImage) {
            showUploadIndicator();
            submitPost(postContent, postImage);
        } else {
            alert('Please enter content or attach an image.');
        }
    });

    function showUploadIndicator() {
        if (uploadIndicator) {
            uploadIndicator.classList.remove('hidden');
            document.querySelector('.post-modal-content').classList.add('disabled');
        } else {
            console.error('Upload indicator element not found');
        }
    }

    function hideUploadIndicator() {
        if (uploadIndicator) {
            uploadIndicator.classList.add('hidden');
            document.querySelector('.post-modal-content').classList.remove('disabled');
        } else {
            console.error('Upload indicator element not found');
        }
    }

    async function resizeImage(file) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 800;
        const scaleFactor = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleFactor;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                console.log('Original file size:', file.size);
                console.log('Compressed file size:', blob.size);
                resolve(new File([blob], file.name, { type: file.type }));
            }, 'image/jpeg', 0.6);
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
            hideUploadIndicator();
            hideModal();
            refreshFeed();
        })
        .catch(error => {
            console.error('Error creating post:', error);
            hideUploadIndicator();
        });
    }

    function showSkeletonLoader() {
        for (let i = 0; i < 3; i++) {
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
            url += `?lastTimestamp=${encodeURIComponent(lastTimestamp)}`;
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

                if (!data.posts || data.posts.length === 0) {
                    loadMoreButton.style.display = 'none';
                } else {
                    lastTimestamp = data.posts[data.posts.length - 1].timestamp;

                    data.posts.forEach(post => {
                        if (!fetchedPostIds.has(post.id)) {
                            fetchedPostIds.add(post.id);
                            appendPostToFeed(post);
                        }
                    });

                    handleImageLoad();
                }
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
            })
            .finally(() => {
                isFetching = false;
            });
    }

    function appendPostToFeed(post) {
        const postElement = document.createElement('div');
        postElement.className = 'col-md-4 hive-post-element mx-auto';
        postElement.innerHTML = `
            <div class="row hive-post-user-details align-items-center">
                <div class="col hive-pfp">
                    <img src="${post.user_profile_picture}" alt="Profile Picture" class="hive-post-user-pfp">
                </div>
                <div class="col hive-user-details-text">
                    <div class="hive-user-name">${post.username}</div>
                    <div class="hive-post-timestamp">${dayjs(post.timestamp).fromNow()}</div>
                </div>
            </div>
            <div class="row hive-post-content">
                <img src="${post.image_url}" alt="Post Image" class="hive-post-img-src">
            </div>
            <div class="hive-social-stats">
                <button class="hive-like-button" data-post-id="${post.id}">Like</button>
                <div class="hive-like-count">${post.like_count} Likes</div>
                <hr class="divider">
            </div>
        `;
        postsContainer.appendChild(postElement);
    }

    function handleLikeButtonClick(event) {
        if (!event.target.classList.contains('hive-like-button')) return;

        const postId = event.target.dataset.postId;
        console.log('Like button clicked for post ID:', postId);

        fetch(`/api/like_post/${postId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to like post');
            }
            return response.json();
        })
        .then(data => {
            console.log('Post liked successfully:', data);
            event.target.textContent = 'Liked';
            const likeCountElement = event.target.nextElementSibling;
            if (likeCountElement) {
                likeCountElement.textContent = `${data.newLikeCount} Likes`;
            }
        })
        .catch(error => {
            console.error('Error liking post:', error);
        });
    }

    function refreshFeed() {
        postsContainer.innerHTML = '';
        lastTimestamp = null;
        fetchedPostIds.clear();
        fetchPosts();
    }

    loadMoreButton.addEventListener('click', fetchPosts);

    postsContainer.addEventListener('click', handleLikeButtonClick);

    fetchPosts();
});
