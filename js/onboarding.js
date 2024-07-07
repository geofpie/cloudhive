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

    // Event listener for window load event
    window.addEventListener('load', function() {
        showContent();
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
                aspectRatio: 1, // Aspect ratio for square cropping
                viewMode: 1, // Show cropped area in view
                autoCropArea: 1, // Automatically set crop area
                movable: false,
                zoomable: false,
                rotatable: false,
                scalable: false,
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
                width: 200, // Set desired width of cropped image
                height: 200, // Set desired height of cropped image
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
});
