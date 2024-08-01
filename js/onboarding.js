document.addEventListener('DOMContentLoaded', function() {
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const profilePicInput = document.getElementById('profile-pic');
    const cropModal = document.getElementById('cropModal');
    const cropModalDialog = cropModal.querySelector('.crop-modal-dialog'); 
    const cropModalClose = cropModal.querySelector('.crop-modal-close');
    const cropSubmitBtn = document.getElementById('crop-submit-btn');
    const cropModelCancel = cropModal.querySelector('.crop-modal-cancel');
    let cropper;

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
            const greetUser = document.querySelector('.herogreet');
            loggedInUserName.textContent = data.userInfo.username;
            loggedInUserEmail.textContent = data.userInfo.email;
            greetUser.textContent = data.userInfo.username;

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
        fetchLoggedInUserInfo(); 
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
                // Initialise Cropper.js instance
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
                // in pixels 
                width: 500, 
                height: 500,
            }).toBlob(function(blob) {
                window.croppedImageBlob = blob;
                const croppedImageUrl = URL.createObjectURL(blob);

                // Update the background image of the preview div
                document.getElementById('profile-pic-preview').style.backgroundImage = `url(${croppedImageUrl})`;

                // Hide custom crop modal
                closeCropModal();
            });
        }
    });    

    const onboardingForm = document.getElementById('onboard-form');

    // Event listener for form submission
    onboardingForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        // Ensure the cropped image blob is available
        if (window.croppedImageBlob) {
            const formData = new FormData();
            formData.append('profilePic', window.croppedImageBlob, 'profile-pic.jpg');

            // Add first-name, last-name, and country to FormData
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;

            formData.append('first-name', firstName);
            formData.append('last-name', lastName);

            // Log the FormData entries
            for (let [key, value] of formData.entries()) {
                console.log(`FormData key: ${key}, value: ${value}`);
            }

            // Show loading indicator on submit button
            const submitButton = document.getElementById('ob-submit-button');
            const originalButtonText = submitButton.innerHTML;
            showSpinner(submitButton);

            // Send the file and additional data to the backend 
            fetch('/api/onboard_profile_update', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'same-origin'
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
});