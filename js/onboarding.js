document.addEventListener('DOMContentLoaded', function() {
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const profilePicInput = document.getElementById('profile-pic');
    const cropModal = document.getElementById('cropModal');
    const cropModalDialog = cropModal.querySelector('.crop-modal-dialog');
    const cropModalClose = cropModal.querySelector('.crop-modal-close');
    const cropSubmitBtn = document.getElementById('crop-submit-btn');
    let cropper;

    function showContent() {
        spinnerWrapper.style.display = 'none';
        document.querySelector('.container-fluid').classList.add('visible');
    }

    function fetchLoggedInUserInfo() {
        fetch('/api/get_user_info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('logged-in-user').textContent = data.userInfo.username;
            document.getElementById('logged-in-user-email').textContent = data.userInfo.email;
        })
        .catch(error => console.error('Error fetching user information:', error));
    }

    window.addEventListener('load', function() {
        showContent();
        fetchLoggedInUserInfo();
    });

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
                cropper = new Cropper(image, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8,
                    movable: false,
                    zoomable: true,
                    rotatable: false,
                    scalable: false,
                    ready: function() {
                        console.log('Cropper.js initialized.');

                        // Adjust Cropper to fit image
                        adjustCropper();
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

    function adjustCropper() {
        if (cropper) {
            // Force Cropper to fit its container
            const container = document.querySelector('.cropper-container');
            const image = document.getElementById('cropper-image');

            // Ensure Cropper container fits the image
            image.style.width = '100%';
            image.style.height = 'auto';

            cropper.resize(); // Trigger a resize event
        }
    }

    setTimeout(function() {
        onboardingForm.classList.add('show');
    }, 100);
});