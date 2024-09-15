// Connect to the Flask-SocketIO server
const socket = io('http://127.0.0.1:8000');

// Set initial token to null (will hold JWT token after login)
let token = null;
let isAdmin = false;

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async event => {
	event.preventDefault();

	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;

	try {
		const response = await fetch('http://127.0.0.1:8000/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();

		if (response.ok) {
			token = data.token; // Store JWT token
			alert('Login successful!');
			showParcelSection();
			checkIfAdmin();
		} else {
			alert(data.message);
		}
	} catch (error) {
		console.error('Error logging in:', error);
	}
});

// Function to display the parcel section after login
function showParcelSection() {
	document.getElementById('user-section').style.display = 'none';
	document.getElementById('parcel-section').style.display = 'block';
	loadParcels();
}

// Check if the logged-in user is an admin
async function checkIfAdmin() {
	try {
		const response = await fetch('http://127.0.0.1:8000/check-admin', {
			headers: { Authorization: `Bearer ${token}` },
		});
		const data = await response.json();
		if (data.is_admin) {
			isAdmin = true;
			document.getElementById('admin-section').style.display = 'block'; // Show admin form
		}
	} catch (error) {
		console.error('Error checking admin status:', error);
	}
}

// Register a new user
document.getElementById('register-form').addEventListener('submit', async event => {
	event.preventDefault();

	const username = document.getElementById('register-username').value;
	const password = document.getElementById('register-password').value;
	const role = document.getElementById('register-role').value; // Get selected role

	try {
		const response = await fetch('http://127.0.0.1:8000/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, role }), // Include role in request
		});

		const data = await response.json();

		if (response.ok) {
			alert('Registration successful! You can now log in.');
			document.getElementById('register-section').style.display = 'none'; // Hide registration form
			document.getElementById('user-section').style.display = 'block'; // Show login form
		} else {
			alert(data.message); // Display error message
		}
	} catch (error) {
		console.error('Error registering:', error);
	}
});

// Load parcels from the server
async function loadParcels() {
	try {
		const response = await fetch('http://127.0.0.1:8000/parcels', {
			headers: { Authorization: `Bearer ${token}` },
		});
		const parcels = await response.json();

		const parcelList = document.getElementById('parcel-list');
		parcelList.innerHTML = ''; // Clear existing parcels

		parcels.forEach(parcel => {
			parcelList.innerHTML += `<li class="list-group-item">
                Parcel ${parcel.id} from ${parcel.sender_name} to ${parcel.receiver_name}, Status: ${parcel.delivery_status}
            </li>`;
		});
	} catch (error) {
		console.error('Error loading parcels:', error);
	}
}

// Handle parcel status update form
document.getElementById('update-parcel-form').addEventListener('submit', async event => {
	event.preventDefault();

	const parcelId = document.getElementById('update-parcel-id').value;
	const newStatus = document.getElementById('update-parcel-status').value;

	try {
		const response = await fetch(`http://127.0.0.1:8000/parcels/${parcelId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({ delivery_status: newStatus }),
		});

		const data = await response.json();
		if (response.ok) {
			alert('Parcel status updated successfully!');
			loadParcels();
		} else {
			alert(data.message);
		}
	} catch (error) {
		console.error('Error updating parcel status:', error);
	}
});

// Handle bulk parcel upload form
document.getElementById('bulk-upload-form').addEventListener('submit', async event => {
	event.preventDefault();

	const fileInput = document.getElementById('bulk-upload-file');
	const file = fileInput.files[0];

	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await fetch('http://127.0.0.1:8000/parcels/bulk', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		const data = await response.json();
		if (response.ok) {
			alert('Bulk upload successful!');
			loadParcels();
		} else {
			alert(data.message);
		}
	} catch (error) {
		console.error('Error during bulk upload:', error);
	}
});

// Handle add parcel form submission (Admin only)
document.getElementById('add-parcel-form').addEventListener('submit', async event => {
	event.preventDefault();

	const senderName = document.getElementById('sender-name').value;
	const receiverName = document.getElementById('receiver-name').value;

	try {
		const response = await fetch('http://127.0.0.1:8000/parcels', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({ sender_name: senderName, receiver_name: receiverName }),
		});

		const data = await response.json();
		if (response.ok) {
			alert('Parcel added successfully!');
			loadParcels(); // Reload parcels after adding a new one
		} else {
			alert(data.message);
		}
	} catch (error) {
		console.error('Error adding parcel:', error);
	}
});

socket.on('connect', function () {
	console.log('Connected to server');
});

socket.on('disconnect', function () {
	console.log('Disconnected from server');
});

// Listen for new parcel events (Real-time updates)
socket.on('new_parcel', function (data) {
	console.log('hitting');
	const parcelList = document.getElementById('parcel-list');
	parcelList.innerHTML += `<li class="list-group-item">
        Parcel ${data.parcel_id} from ${data.sender_name} to ${data.receiver_name}, Status: ${data.status}
    </li>`;
});

// Listen for parcel status update events
socket.on('update_parcel', function (data) {
	alert(`Parcel ${data.parcel_id} status updated to: ${data.status}`);
	loadParcels(); // Reload parcels when a status is updated
});

// Listen for bulk parcel processing progress
socket.on('bulk_progress', function (data) {
	console.log('Bulk progress:', data.progress);
	// Update the UI to show progress
});
