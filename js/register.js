document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const container = document.querySelector('.container-fluid');

    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const username = document.getElementById('register-field-username').value;
        const email = document.getElementById('register-field-email').value;
        const password = document.getElementById('register-field-password').value;
        const confirmPassword = document.getElementById('register-field-confirm-password').value;
        const registerButton = document.getElementById('register-button');
        const originalButtonText = registerButton.innerHTML;

        // Check if passwords match
        if (password !== confirmPassword) {
            displayPopup('Passwords do not match', 'text-danger');
            return;
        }

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
                return response.json().then(data => {
                    const errorMessage = data.error || 'Registration failed';
                    displayPopup(errorMessage, 'text-danger');
                });
            }
            return response.json();
        })
        .then(data => {
            hideSpinner(registerButton, originalButtonText);

            if (data.token) {
                // Registration success with token
                displayPopup('Registration was successful! You can proceed to login now.', 'text-success');
            }
        })
        .catch(error => {
            // Handle other errors
            const errorMessage = error.message || 'Failed to register user';
            displayPopup(errorMessage, 'text-danger');
            hideSpinner(registerButton, originalButtonText);
        });
    });

    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

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
        popup.classList.add('ajax-popup');
        
        // Overlay background
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        popup.appendChild(overlay);
        
        // Popup content
        const popupContent = document.createElement('div');
        popupContent.classList.add('popup-content', className);
        popupContent.textContent = message;
    
        // Close button
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', function() {
            popup.remove();
        });
    
        // Append content and close button to popup
        popupContent.appendChild(closeButton);
        popup.appendChild(popupContent);
    
        // Append popup to body
        document.body.appendChild(popup);
    }
});