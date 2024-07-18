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

dayjs.extend(dayjs_plugin_relativeTime);

document.addEventListener('DOMContentLoaded', function() {
    let lastPostTimestamp = null;
    const postsContainer = document.getElementById('newsfeed-posts-container');
    const loadMoreButton = document.getElementById('load-more');
    let isFetching = false;

    function fetchPosts() {
        if (isFetching) return;
        isFetching = true;

        let url = `/api/newsfeed`;
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
                        const postElement = document.createElement('div');
                        postElement.className = 'hive-post';

                        const postTemplate = `
                        <div class="col-md-5 hive-post-element mx-auto">
                            <div class="row hive-post-user-details align-items-center">
                                <div class="col">
                                    <img src="${post.userProfilePicture || '../assets/default-profile.jpg'}" alt="Profile" class="post-profile-pic">
                                </div>
                                <div class="col hive-user-details-text">
                                    <a href="/${post.username}" class="hive-post-username">${post.first_name}</a>
                                    <a href="/${post.username}" class="hive-post-user-sub">@${post.username}</a>
                                    <i class="fa fa-clock hive-post-time-icon"></i><p class="hive-post-time">${dayjs(post.timestamp).fromNow()}</p>
                                </div>
                            </div>
                            <div class="row hive-post-content">
                                <p class="hive-post-text">${post.content}</p>
                                ${post.imageUrl ? `<div class="hive-post-image shadow-sm"><img class="hive-post-img-src" data-src="${post.imageUrl}" src="${post.imageUrl}" alt="Post Image"></div>` : ''}
                            </div>
                            <div class="hive-social-stats">
                                <p class="hive-stat-like"><strong>${post.likes || 0}</strong> likes</p>
                                <hr>
                                <button class="hive-stat-like-btn"><i class="fa fa-heart hive-stat-like-heart"></i>Like</button>
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

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isFetching && lastPostTimestamp) {
            fetchPosts();
        }
    });
});
