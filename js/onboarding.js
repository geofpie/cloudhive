document.addEventListener('DOMContentLoaded', function() {
    const profilePicInput = document.getElementById('profile-pic');
    const cropModal = document.getElementById('cropModal');
    const cropModalClose = cropModal.querySelector('.crop-modal-close');
    const cropSubmitBtn = document.getElementById('crop-submit-btn');
    let cropper;

    // Function to adjust cropper container size
    function adjustCropperContainer() {
        const container = document.querySelector('.cropper-container');
        if (container) {
            container.style.width = '500px'; // Set fixed width
            container.style.height = '500px'; // Set fixed height
        }
    }

    profilePicInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length === 0) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            if (cropper) {
                cropper.destroy();
            }

            const image = document.getElementById('cropper-image');
            image.src = e.target.result;

            image.onload = function() {
                // Ensure container dimensions match modal size
                adjustCropperContainer();

                // Initialize Cropper.js
                cropper = new Cropper(image, {
                    aspectRatio: 1, // Square aspect ratio
                    viewMode: 1, // Restrict the crop box within the container
                    autoCropArea: 1, // Fill the crop box with the image
                    movable: true, // Allow moving the image
                    zoomable: true, // Allow zooming the image
                    rotatable: false, // Disable rotation
                    scalable: false, // Disable scaling
                    ready: function() {
                        console.log('Cropper.js initialized.');
                    }
                });

                openCropModal();
            };
        };
        reader.readAsDataURL(files[0]);
    });

    function openCropModal() {
        cropModal.style.display = 'block';
    }

    function closeCropModal() {
        cropModal.style.display = 'none';
    }

    cropModalClose.addEventListener('click', closeCropModal);

    cropSubmitBtn.addEventListener('click', function() {
        if (cropper) {
            cropper.getCroppedCanvas({
                width: 500,
                height: 500,
            }).toBlob(function(blob) {
                window.croppedImageBlob = blob;
                const croppedImageUrl = URL.createObjectURL(blob);
                document.getElementById('profile-pic-preview').style.backgroundImage = `url(${croppedImageUrl})`;
                closeCropModal();
            });
        }
    });

    const onboardingForm = document.querySelector('.onboarding-form');

    onboardingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (window.croppedImageBlob) {
            const formData = new FormData();
            formData.append('profilePic', window.croppedImageBlob, 'profile-pic.jpg');
            formData.append('first-name', document.getElementById('first-name').value);
            formData.append('last-name', document.getElementById('last-name').value);
            formData.append('country', document.getElementById('country').value);

            const submitButton = document.getElementById('ob-submit-button');
            const originalButtonText = submitButton.innerHTML;
            showSpinner(submitButton);

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
                hideSpinner(submitButton, originalButtonText);
                if (data.error) {
                    console.error('Error uploading profile picture:', data.error);
                    return;
                }
                window.location.href = '/hive';
            })
            .catch(error => {
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