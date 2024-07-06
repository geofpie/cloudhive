document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const container = document.querySelector('.container-fluid'); // Updated to select the main container

    // Event listener for login link
    loginLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (!loginLink.classList.contains('active')) {
            registerLink.classList.remove('active');
            loginLink.classList.add('active');
            fadeForms(loginForm, registerForm);
        }
    });

    // Event listener for register link
    registerLink.addEventListener('click', function(event) {
        event.preventDefault();
        if (!registerLink.classList.contains('active')) {
            loginLink.classList.remove('active');
            registerLink.classList.add('active');
            fadeForms(registerForm, loginForm);
        }
    });

    // Function to handle form fading
    function fadeForms(formToShow, formToHide) {
        formToShow.classList.add('fade-in', 'visible');
        formToHide.classList.remove('visible', 'fade-in');
        container.classList.add('fade-in'); // Trigger fade-in effect on container
    }

    // Hide spinner when content is loaded
    window.addEventListener('load', function() {
        spinnerWrapper.style.display = 'none';
        container.classList.add('visible'); // Ensure container is visible after loading
    });

    // Event listener for register form submission
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

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
            // Check server response status
            if (data.status === 200) {
                document.getElementById('register-message').innerText = 'User registered successfully';
                document.getElementById('register-message').classList.remove('text-danger');
                document.getElementById('register-message').classList.add('text-success');
            } else if (data.status === 409) {
                throw new Error(data.error || 'Username or email already exists');
            } else {
                throw new Error('Unknown error');
            }
        })
        .catch(error => {
            // Handle registration error
            hideSpinner(registerButton, originalButtonText);
            document.getElementById('register-message').innerText = error.message || 'Failed to register user';
            document.getElementById('register-message').classList.add('text-danger');
        });
    });

    // Function to show spinner and replace button text
    function showSpinner(button) {
        button.innerHTML = '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>';
        button.disabled = true; // Optionally disable the button while processing
    }

    // Function to hide spinner and restore button text
    function hideSpinner(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false; // Re-enable the button after processing
    }
});
