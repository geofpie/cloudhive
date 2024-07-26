    document.addEventListener('DOMContentLoaded', function () {
        fetchUserInfo();

        // Get the token from a global variable or another source
        const token = '<%= user.token %>';

        fetch('/api/friends', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const friendsContainer = document.querySelector('.row');
            friendsContainer.innerHTML = ''; // Clear existing content
            data.friends.forEach(friend => {
                const friendCard = `
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <img src="${friend.profile_picture_url || '/assets/default-profile.jpg'}" class="card-img-top" alt="Profile Picture">
                            <div class="card-body">
                                <h5 class="card-title">${friend.first_name} ${friend.last_name}</h5>
                                <p class="card-text">@${friend.username}</p>
                                <p class="card-text">Following: ${friend.following}</p>
                                <p class="card-text">Followers: ${friend.followers}</p>
                                <a href="/${friend.username}" class="btn btn-primary">View Profile</a>
                            </div>
                        </div>
                    </div>`;
                friendsContainer.insertAdjacentHTML('beforeend', friendCard);
            });
        })
        .catch(error => {
            console.error('Error fetching friends data:', error);
        });
    });

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
                // Redirect to homepage if user is unauthorised
                window.location.href = '/';
                return; // Stop further processing
            }
            
            if (!response.ok) {
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
            // Optionally redirect to homepage on catch error
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
    