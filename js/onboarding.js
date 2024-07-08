document.addEventListener('DOMContentLoaded', function() {
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const profilePicInput = document.getElementById('profile-pic');
    const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
    let cropper;

    // Function to hide spinner and show content
    function showContent() {
        spinnerWrapper.style.display = 'none';
        document.querySelector('.container-fluid').classList.add('visible');
    }

    // Function to fetch logged-in user information
    function fetchLoggedInUserInfo() {
        console.log('Fetching logged-in user info...');
        fetch('/api/get_user_info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin' // Send cookies
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user information');
            }
            return response.json();
        })
        .then(data => {
            // Update logged-in user fields
            const loggedInUserName = document.getElementById('logged-in-user');
            const loggedInUserEmail = document.getElementById('logged-in-user-email');
            loggedInUserName.textContent = data.userInfo.username;
            loggedInUserEmail.textContent = data.userInfo.email;

            // Log user information to console
            console.log('Logged-in User:', data.userInfo.username);
            console.log('Logged-in User Email:', data.userInfo.email);
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });
    }

    // Event listener for window load event
    window.addEventListener('load', function() {
        showContent();
        fetchLoggedInUserInfo(); // Fetch logged-in user info on page load
    });

    // Event listener for opening crop modal when profile pic input changes
    profilePicInput.addEventListener('change', function(e) {
        var files = e.target.files;
        var reader = new FileReader();
        reader.onload = function(e) {
            // Destroy previous Cropper instance if exists
            if (cropper) {
                cropper.destroy();
            }
            // Set the image source to cropper and preview
            const image = document.getElementById('cropper-image');
            image.src = e.target.result;
            // Initialize Cropper.js
            cropper = new Cropper(image, {
                aspectRatio: 1, // Set to 1 for square aspect ratio
                viewMode: 1, // Set to 1 for preview mode, allowing user manipulation
                autoCropArea: 0.8, // Set to 0.8 for initial crop area size (80% of the image)
                movable: false, // Disable user movement of the crop box
                zoomable: true, // Allow user to zoom the image
                rotatable: false, // Disable image rotation
                scalable: false, // Disable image scaling
                ready: function() {
                    // This function is called when Cropper.js is ready
                }
            });
            // Show crop modal
            cropModal.show();
        };
        reader.readAsDataURL(files[0]);
    });

    // Event listener for crop image button in modal
    document.getElementById('crop-submit-btn').addEventListener('click', function() {
        if (cropper) {
            // Get cropped image data
            cropper.getCroppedCanvas({
                width: 500, // Set desired width of cropped image
                height: 500, // Set desired height of cropped image
            }).toBlob(function(blob) {
                // Create a new FileReader
                var reader = new FileReader();
                // Convert Blob to Base64
                reader.readAsDataURL(blob);
                reader.onloadend = function() {
                    var base64data = reader.result;
                    // Update profile pic preview
                    const profilePicPreview = document.getElementById('profile-pic-preview');
                    profilePicPreview.style.backgroundImage = `url(${base64data})`;
                    profilePicPreview.style.backgroundSize = 'cover';
                    profilePicPreview.style.backgroundPosition = 'center';
                    // Close modal
                    cropModal.hide();
                };
            });
        }
    });

    function resizeInput() {
        this.style.width = (this.value.length + 1) + "ch";
    }

    document.querySelectorAll('.onboard-name-field').forEach(input => {
        input.addEventListener('input', resizeInput);
        input.style.width = (input.placeholder.length + 1) + "ch"; // Initial width based on placeholder
    });

    document.getElementById('crop-submit-btn').addEventListener('click', function() {
        if (cropper) {
            cropper.getCroppedCanvas({
                width: 500, // Set desired width of cropped image
                height: 500, // Set desired height of cropped image
            }).toBlob(function(blob) {
                // Create a FormData object to send the file
                var formData = new FormData();
                formData.append('profilePic', blob, 'profile-pic.jpg');
    
                // Log the FormData entries
                for (let [key, value] of formData.entries()) {
                    console.log(`FormData key: ${key}, value: ${value}`);
                }
    
                // Send the file to the server
                fetch('/api/onboard_profile_update', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'same-origin' // Include cookies with request
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error uploading profile picture:', data.error);
                        return;
                    }
    
                    console.log('Profile picture uploaded successfully:', data);
    
                    // Update profile pic preview
                    const profilePicPreview = document.getElementById('profile-pic-preview');
                    profilePicPreview.style.backgroundImage = `url(${data.profilePicUrl})`;
                    profilePicPreview.style.backgroundSize = 'cover';
                    profilePicPreview.style.backgroundPosition = 'center';
                    // Close modal
                    cropModal.hide();
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            });
        }
    });
    

    // Select the form element
    const onboardingForm = document.querySelector('.onboarding-form');

    // Add a class to trigger the animation after a short delay
    setTimeout(function() {
        onboardingForm.classList.add('show');
    }, 100); // Adjust delay as needed
});
