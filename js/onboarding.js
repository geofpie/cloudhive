document.addEventListener('DOMContentLoaded', function() {
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const profilePicInput = document.getElementById('profile-pic');
    const cropModal = document.getElementById('cropModal');
    const cropModalDialog = cropModal.querySelector('.crop-modal-dialog'); // Custom modal dialog
    const cropModalClose = cropModal.querySelector('.crop-modal-close'); // Custom close button
    const cropSubmitBtn = document.getElementById('crop-submit-btn'); // Crop button in custom modal
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
                    aspectRatio: 1, // Set to 1 for square aspect ratio
                    viewMode: 1, // Set to 1 for preview mode, allowing user manipulation
                    autoCropArea: 0.8, // Set to 0.8 for initial crop area size (80% of the image)
                    movable: false, // Disable user movement of the crop box
                    zoomable: true, // Allow user to zoom the image
                    rotatable: false, // Disable image rotation
                    scalable: false, // Disable image scaling
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
                document.getElementById('profile-pic-preview').style.backgroundImage = `url(${croppedImageUrl})`;

                // Hide custom crop modal
                closeCropModal();
            });
        }
    });    

    // Select the form element
    const onboardingForm = document.querySelector('.onboarding-form');

    // Event listener for form submission
    onboardingForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        // Ensure the cropped image blob is available
        if (window.croppedImageBlob) {
            const formData = new FormData();
            formData.append('profilePic', window.croppedImageBlob, 'profile-pic.jpg');

            // Add first-name, last-name, and country to FormData
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const country = document.getElementById('country').value;

            formData.append('first-name', firstName);
            formData.append('last-name', lastName);
            formData.append('country', country);

            // Log the FormData entries
            for (let [key, value] of formData.entries()) {
                console.log(`FormData key: ${key}, value: ${value}`);
            }

            // Show loading indicator (spinner) on submit button
            const submitButton = document.getElementById('ob-submit-button');
            const originalButtonText = submitButton.innerHTML;
            showSpinner(submitButton);

            // Send the file and additional data to the server using form's action attribute
            fetch('/api/onboard_profile_update', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin' // Include cookies with request if needed
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading indicator (spinner)
                hideSpinner(submitButton, originalButtonText);

                if (data.error) {
                    console.error('Error uploading profile picture:', data.error);
                    return;
                }

                console.log('Profile picture uploaded successfully:', data);
                // Redirect to homepage
                window.location.href = '/hive';
            })
            .catch(error => {
                // Hide loading indicator (spinner)
                hideSpinner(submitButton, originalButtonText);
                console.error('Error:', error);
            });
        } else {
            console.error('No cropped image blob available for upload.');
        }
    });

    function showSpinner(button) {
        button.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>';
        button.disabled = true;
    }

    function hideSpinner(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }

    // Add a class to trigger the animation after a short delay
    setTimeout(function() {
        onboardingForm.classList.add('show');
    }, 100); // Adjust delay as needed
});