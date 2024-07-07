document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const spinnerWrapper = document.querySelector('.spinner-wrapper');
    const container = document.querySelector('.container-fluid');
    const registerMessage = document.getElementById('register-message');

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
        .then(response => response.json())
        .then(data => {
            hideSpinner(registerButton, originalButtonText);
    
            if (data.token) {
                // Registration success with token
                registerMessage.innerText = data.message;
                registerMessage.classList.remove('text-danger');
                registerMessage.classList.add('text-success');

                // Redirect to onboarding page with token
                console.log('Redirecting to onboarding');
                window.location.href = '/onboarding.html';

            } else {
                // Registration error (username or email exists)
                const errorMessage = data.error || 'Unknown Error';
                registerMessage.innerText = errorMessage;
                registerMessage.classList.remove('text-success');
                registerMessage.classList.add('text-danger');
            }
        })
        .catch(error => {
            // Handle other errors
            registerMessage.innerText = error.message || 'Failed to register user';
            registerMessage.classList.remove('text-success');
            registerMessage.classList.add('text-danger');
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
});
