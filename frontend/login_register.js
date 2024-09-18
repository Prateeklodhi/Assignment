// Connect to the Socket.IO server
const socket = io('http://127.0.0.1:8000');

// Function to show login form and hide signup form
function showLoginForm() {
	document.getElementById('login-section').style.display = 'block';
	document.getElementById('register-section').style.display = 'none';
}

// Function to show signup form and hide login form
function showRegisterForm() {
	document.getElementById('login-section').style.display = 'none';
	document.getElementById('register-section').style.display = 'block';
}

// Add event listeners to switch between login and register forms
document.getElementById('go-to-register').addEventListener('click', showRegisterForm);
document.getElementById('go-to-login').addEventListener('click', showLoginForm);

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', async event => {
	event.preventDefault();

	const username = document.getElementById('register-username').value;
	const password = document.getElementById('register-password').value;
	const confirmPassword = document.getElementById('confirm-password').value;
	const role = document.getElementById('register-role').value;

	// Check if passwords match
	if (password !== confirmPassword) {
		document.getElementById('password-error').style.display = 'block'; // Show error
		return; // Stop form submission
	} else {
		document.getElementById('password-error').style.display = 'none'; // Hide error
	}

	try {
		const response = await fetch('http://127.0.0.1:8000/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, role }),
		});

		const data = await response.json();

		if (response.ok) {
			// Emit a socket event when a user registers
			socket.emit('user_registered', { username, role });

			alert('Registration successful! You can now log in.');
			showLoginForm(); // Show login form after successful registration
		} else {
			alert(data.message); // Display error message
		}
	} catch (error) {
		console.error('Error registering:', error);
	}
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://127.0.0.1:8000/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, password }),
				});

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token); // Store JWT token
            alert('Login successful!');
            window.location.href = 'home.html'; // Redirect to home page
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
});

socket.on('connect', function () {
	console.log('Connected to server');
});

socket.on('disconnect', function () {
	console.log('Disconnected from server');
});

// Listen for new user registration events from the server
socket.on('new_user', data => {
	console.log(`New user registered: ${data.username} with role ${data.role}`);
});
