document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const container = document.querySelector('.container-fluid');

    loginLink.addEventListener('click', function(event) {
        event.preventDefault();
        switchForm(loginForm, registerForm);
        switchActiveLink(loginLink, registerLink);
    });

    registerLink.addEventListener('click', function(event) {
        event.preventDefault();
        switchForm(registerForm, loginForm);
        switchActiveLink(registerLink, loginLink);
    });

    window.addEventListener('load', function() {
        spinnerWrapper.style.display = 'none';
        container.classList.add('visible');
    });

    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const username = document.getElementById('register-field-username').value;
        const email = document.getElementById('register-field-email').value;
        const password = document.getElementById('register-field-password').value;
        const registerButton = document.getElementById('register-button');
        const originalButtonText = registerButton.innerHTML;
    
        showSpinner(registerButton);
    
        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            hideSpinner(registerButton, originalButtonText);
    
            if (data.token) {
                // Registration success with token
                displayPopup('Registration Successful', 'text-success');
                // Optionally, you can redirect or handle success here
            } else {
                // Registration error (username or email exists)
                const errorMessage = data.error || 'Unknown Error';
                displayPopup(errorMessage, 'text-danger');
            }
        })
        .catch(error => {
            // Handle other errors
            const errorMessage = error.message || 'Failed to register user';
            displayPopup(errorMessage, 'text-danger');
            hideSpinner(registerButton, originalButtonText);
        });
    });

    function switchForm(formToShow, formToHide) {
        formToShow.classList.add('fade-in', 'visible');
        formToHide.classList.remove('visible', 'fade-in');
        container.classList.add('fade-in');
    }

    function switchActiveLink(activeLink, inactiveLink) {
        activeLink.classList.add('active');
        inactiveLink.classList.remove('active');
    }

    function showSpinner(button) {
        button.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>';
        button.disabled = true;
    }

    function hideSpinner(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }

    function displayPopup(message, className) {
        // Create popup element
        const popup = document.createElement('div');
        popup.classList.add('ajax-popup', className);
        popup.textContent = message;
    
        // Position popup in the center of the screen
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '9999'; // Ensure it's on top of everything
    
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '&times;'; // Close button symbol
        closeButton.addEventListener('click', function() {
            popup.remove(); // Remove popup on close button click
        });
        popup.appendChild(closeButton);
    
        // Append popup to body
        document.body.appendChild(popup);
    
        // Automatically remove popup after a timeout (adjust as needed)
        setTimeout(() => {
            popup.remove();
        }, 10000); // Adjust the timeout as needed for how long you want the popup to display
    }
    
});
