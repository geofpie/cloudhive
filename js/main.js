document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const container = document.querySelector('.container-fluid');
    const registerMessage = document.getElementById('register-message');

    // Event listeners for switching between login and register forms
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

    // Function to switch forms visibility
    function switchForm(formToShow, formToHide) {
        formToShow.classList.add('fade-in', 'visible');
        formToHide.classList.remove('visible', 'fade-in');
        container.classList.add('fade-in');
    }

    // Function to switch active link
    function switchActiveLink(activeLink, inactiveLink) {
        activeLink.classList.add('active');
        inactiveLink.classList.remove('active');
    }

    // Hide spinner when content is loaded
    window.addEventListener('load', function() {
        spinnerWrapper.style.display = 'none';
        container.classList.add('visible');
    });

    // Event listener for register form submission
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('register-field-username').value;
        const email = document.getElementById('register-field-email').value;
        const password = document.getElementById('register-field-password').value;
        const registerButton = document.getElementById('register-button');
        const originalButtonText = registerButton.innerHTML;

        // Show spinner and disable button
        showSpinner(registerButton);

        // Perform AJAX request
        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to register user');
            }
            return response.json();
        })
        .then(data => {
            if (data.message) {
                // Registration success
                registerMessage.innerText = data.message;
                registerMessage.classList.remove('text-danger');
                registerMessage.classList.add('text-success');
            } else {
                // Registration error (username or email exists)
                const errorMessage = data.error || 'Username or email already exists';
                registerMessage.innerText = errorMessage;
                registerMessage.classList.add('text-danger');
            }
        })
        .catch(error => {
            // Handle other errors
            registerMessage.innerText = error.message || 'Failed to register user';
            registerMessage.classList.add('text-danger');
        })
        .finally(() => {
            hideSpinner(registerButton, originalButtonText);
        });
    });

    // Function to show spinner and disable button
    function showSpinner(button) {
        button.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>';
        button.disabled = true;
    }

    // Function to hide spinner and restore button text
    function hideSpinner(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
});
