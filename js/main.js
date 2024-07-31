document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const container = document.querySelector('.container-fluid');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const identifier = document.getElementById('login-field-username').value; // Can be username or email
        const password = document.getElementById('login-field-password').value;
        const loginButton = document.getElementById('login-button');
        const originalButtonText = loginButton.innerHTML;

        showSpinner(loginButton);

        fetch('/api/login_redirect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        })
        .then(response => {
            hideSpinner(loginButton, originalButtonText);
            
            if (response.redirected) {
                // Handle redirect
                window.location.href = response.url;
                return;
            }

            if (!response.ok) {
                return response.json().then(data => {
                    const errorMessage = data.error || 'Invalid credentials';
                    displayPopup(errorMessage, 'text-danger');
                });
            }

            return response.json();
        })
        .then(data => {
            if (data.token) {
                // Set token as a cookie
                setCookie('token', data.token, 1);

                // Redirect to homepage
                window.location.href = '/hive';
            }
        })
        .catch(error => {
            // Handle other login errors
            const errorMessage = error.message || 'Failed to login';
            displayPopup(errorMessage, 'text-danger');
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