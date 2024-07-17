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

document.addEventListener('DOMContentLoaded', function() {
    let lastPostId = null;
    const postsContainer = document.getElementById('newsfeed-posts-container');
    const loadMoreButton = document.getElementById('load-more');

    function fetchPosts() {
        let url = '/api/newsfeed';
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
            .then(response => response.json())
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
                    lastPostId = data.LastEvaluatedKey ? data.LastEvaluatedKey : null;
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
