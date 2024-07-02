document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('.login-form-link');
    const registerLink = document.querySelector('.register-form-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginRegisterForm = document.querySelector('.login-register-form');
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

    // Initial adjustment of form container height
    updateFormContainerHeight();

    // Event listener for login form submission
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = {
            username: document.getElementById('login-field-username').value,
            password: document.getElementById('login-field-password').value
        };
        console.log('Login Form Data:', formData); // Log form data

        try {
            const response = await fetch('http://172.31.22.2:8080/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Login Response:', responseData);
            // Handle login success (e.g., redirect or show message)
            alert('Login successful!');
        } catch (error) {
            console.error('Login Error:', error);
            // Handle login error (e.g., show error message to user)
            alert('Login failed. Please try again.');
        }
    });

    // Event listener for register form submission
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = {
            username: document.getElementById('register-field-username').value,
            email: document.getElementById('register-field-email').value,
            password: document.getElementById('register-field-password').value
        };
        console.log('Register Form Data:', formData); // Log form data

        try {
            const response = await fetch('http://172.31.22.2:8080/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Registration Response:', responseData);
            // Handle registration success (e.g., redirect or show message)
            alert('Registration successful!');
        } catch (error) {
            console.error('Registration Error:', error);
            // Handle registration error (e.g., show error message to user)
            alert('Registration failed. Please try again.');
        }
    });
});
