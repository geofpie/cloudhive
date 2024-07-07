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

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const identifier = document.getElementById('login-field-username').value; // Can be username or email
        const password = document.getElementById('login-field-password').value;
        const loginButton = document.getElementById('login-button');
        const originalButtonText = loginButton.innerHTML;
    
        showSpinner(loginButton);
    
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            hideSpinner(loginButton, originalButtonText);
    
            if (data.token) {
                // Set token as a cookie
                setCookie('token', data.token, 1); // Adjust expiry as needed (1 day in this case)
    
                // Redirect based on server response (handled by backend)
                if (response.status === 302) {
                    window.location.href = response.headers.get('Location');
                    return;
                }
                
                // Handle other cases (success scenario)
                window.location.href = '/dashboard';
            } else {
                // Login error (invalid credentials)
                const errorMessage = data.error || 'Invalid credentials';
                displayPopup(errorMessage, 'text-danger');
            }
        })
        .catch(error => {
            // Handle other login errors
            const errorMessage = error.message || 'Failed to login';
            displayPopup(errorMessage, 'text-danger');
            hideSpinner(loginButton, originalButtonText);
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
