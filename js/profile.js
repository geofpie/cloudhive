// Cropper.js Setup
let cropper;

// Open Edit Profile Modal and Populate Fields
const editProfileModal = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const profilePictureInput = document.getElementById('profilePicture');
const profileHeaderInput = document.getElementById('profileHeader');
const profilePicturePreview = document.getElementById('profilePicturePreview');
const profileHeaderPreview = document.getElementById('profileHeaderPreview');
const cropperModal = document.getElementById('cropperModal');
const cropperImage = document.getElementById('cropperImage');
const cropImageBtn = document.getElementById('cropImageBtn');

document.querySelector('.profile-stat.hive-user-action').addEventListener('click', () => {
   fetchUserInfoAndPopulateForm();
   $('#editProfileModal').modal('show');
});

// Function to fetch user info and populate form
function fetchUserInfoAndPopulateForm() {
   fetch('/api/get_user_info', {
       method: 'GET',
       headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming you're using JWT tokens stored in localStorage
       }
   })
   .then(response => {
       if (!response.ok) {
           throw new Error('Network response was not ok');
       }
       return response.json();
   })
   .then(data => {
       // Populate form fields with user data
       document.getElementById('firstName').value = data.userInfo.firstName;
       document.getElementById('lastName').value = data.userInfo.lastName;
       document.getElementById('username').value = data.userInfo.username;
       document.getElementById('email').value = data.userInfo.email;

       // Set profile picture and profile header previews
       profilePicturePreview.src = data.userInfo.profile_picture_url || '../assets/default-profile.jpg';
       profileHeaderPreview.src = data.userInfo.profile_header_url || '../assets/default-profile-header.jpg';

   })
   .catch(error => {
       console.error('Error fetching user info:', error);
       // Handle error or display message to user
   });
}

// Handle profile picture input change to update preview and open cropper modal
profilePictureInput.addEventListener('change', () => {
   const file = profilePictureInput.files[0];
   if (file) {
       profilePicturePreview.src = URL.createObjectURL(file);
       $('#cropperModal').modal('show');
       cropperImage.src = URL.createObjectURL(file);
       initializeCropper();
   }
});

// Handle profile header input change to update preview and open cropper modal
profileHeaderInput.addEventListener('change', () => {
   const file = profileHeaderInput.files[0];
   if (file) {
       profileHeaderPreview.src = URL.createObjectURL(file);
       $('#cropperModal').modal('show');
       cropperImage.src = URL.createObjectURL(file);
       initializeCropper();
   }
});

// Initialize Cropper.js
function initializeCropper() {
   cropper = new Cropper(cropperImage, {
       aspectRatio: 1, // Adjust as needed for your image aspect ratio
       viewMode: 1, // Restrict the cropped area to fit within the container
   });
}

// Handle Cropper Modal Close
$('#cropperModal').on('hidden.bs.modal', () => {
   // Destroy cropper instance to free up memory
   cropper.destroy();
   cropper = null;
});

// Handle Crop Image Button Click
cropImageBtn.addEventListener('click', () => {
   const canvas = cropper.getCroppedCanvas();
   if (canvas) {
       canvas.toBlob((blob) => {
           // Replace the original file with the cropped blob
           const croppedFile = new File([blob], profilePictureInput.files[0].name);
           profilePictureInput.files[0] = croppedFile;
           // Update preview with cropped image
           profilePicturePreview.src = URL.createObjectURL(blob);
           // Close Cropper Modal
           $('#cropperModal').modal('hide');
       });
   }
});

// Handle Form Submission
editProfileForm.addEventListener('submit', (event) => {
   event.preventDefault();
   const formData = new FormData(editProfileForm);

   fetch('/api/update_profile', {
       method: 'POST',
       body: formData,
       headers: {
           'Authorization': 'Bearer ' + localStorage.getItem('token') // Add authorization if needed
       }
   })
   .then(response => {
       if (!response.ok) {
           throw new Error('Failed to update profile');
       }
       return response.json();
   })
   .then(data => {
       console.log('Profile updated successfully:', data);
       $('#editProfileModal').modal('hide'); // Hide modal after successful update
       // Optionally update UI with new profile details
   })
   .catch(error => {
       console.error('Error updating profile:', error);
       // Handle error or display message to user
   });
});
