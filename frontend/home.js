// Connect to the Socket.IO server
const socket = io('http://127.0.0.1:8000');

// Check if the user is logged in
function checkLoginStatus() {
	const token = localStorage.getItem('token');
	if (!token) {
		// No token found, redirect to login page
		alert('Please log in to continue.');
		window.location.href = 'login_register.html';
	} else {
		// Verify user role and load parcels
		checkUserRole(token);
		loadParcels(token);
	}
}

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
	localStorage.removeItem('token'); // Clear the token from localStorage
	alert('Logged out successfully.');
	window.location.href = 'login_register.html'; // Redirect to login page
});

// Load parcels from the server
async function loadParcels(token) {
	try {
		const response = await fetch('http://127.0.0.1:8000/parcels', {
			headers: { Authorization: `Bearer ${token}` }, // Pass the JWT token in the header
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

// Check the user's role and display admin functionality if needed
async function checkUserRole(token) {
	try {
		const response = await fetch('http://127.0.0.1:8000/check-admin', {
			headers: { Authorization: `Bearer ${token}` }, // Pass the JWT token
		});
		const data = await response.json();

		if (data.is_admin) {
			document.getElementById('admin-section').style.display = 'block'; // Show Add Parcel form
			document.getElementById('update-parcel-section').style.display = 'block'; // Show Update Parcel form
			document.getElementById('bulk-upload-section').style.display = 'block'; // Show Bulk Upload form
		} else {
			document.getElementById('admin-section').style.display = 'none'; // Hide Admin features
			document.getElementById('update-parcel-section').style.display = 'none';
			document.getElementById('bulk-upload-section').style.display = 'none';
		}
	} catch (error) {
		console.error('Error checking user role:', error);
	}
}

// Handle add parcel form submission (Admin only)
document.getElementById('add-parcel-form').addEventListener('submit', async event => {
	event.preventDefault();

	const senderName = document.getElementById('sender-name').value;
	const receiverName = document.getElementById('receiver-name').value;
	const token = localStorage.getItem('token'); // Retrieve token from localStorage

	try {
		const response = await fetch('http://127.0.0.1:8000/parcels', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`, // Pass the JWT token in the header
			},
			body: JSON.stringify({ sender_name: senderName, receiver_name: receiverName }),
		});

		const data = await response.json();
		if (response.ok) {
			alert('Parcel added successfully!');

			// Emit a socket event when a parcel is added
			socket.emit('parcel_added', { sender_name: senderName, receiver_name: receiverName });

			loadParcels(token); // Reload parcels after adding a new one
		} else {
			alert(data.message);
		}
	} catch (error) {
		console.error('Error adding parcel:', error);
	}
});

// Handle parcel status update (Admin only)
document.getElementById('update-parcel-form').addEventListener('submit', async event => {
	event.preventDefault();

	const parcelId = document.getElementById('update-parcel-id').value;
	const newStatus = document.getElementById('update-parcel-status').value;
	const token = localStorage.getItem('token'); // Retrieve token from localStorage

	try {
		const response = await fetch(`http://127.0.0.1:8000/parcels/${parcelId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`, // Pass the JWT token in the header
			},
			body: JSON.stringify({ delivery_status: newStatus }),
		});

		const data = await response.json();
		if (response.ok) {
			alert('Parcel status updated successfully!');

			// Emit a socket event when a parcel is updated
			socket.emit('parcel_updated', { parcel_id: parcelId, delivery_status: newStatus });

			loadParcels(token); // Reload parcels after updating the status
		} else {
			alert(data.message);
		}
	} catch (error) {
		console.error('Error updating parcel status:', error);
	}
});

// Handle bulk parcel upload (Admin only)
document.getElementById('bulk-upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('bulk-upload-file');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token'); // Retrieve token from localStorage

    try {
        const response = await fetch('http://127.0.0.1:8000/parcels/bulk', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}` // Pass the JWT token in the header
            },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            alert('Bulk upload successful!');
            loadParcels(token); // Reload parcels after bulk upload
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during bulk upload:', error);
    }
});


// Listen for new parcel events from the server
socket.on('new_parcel', data => {
	alert(`New parcel added: From ${data.sender_name} to ${data.receiver_name}`);
	loadParcels(localStorage.getItem('token'));
});

// Listen for parcel update events from the server
socket.on('update_parcel', data => {
	alert(`Parcel ID ${data.parcel_id} has been updated to status: ${data.status}`);
	loadParcels(localStorage.getItem('token'));
});


// Call checkLoginStatus when the page loads
document.addEventListener('DOMContentLoaded', checkLoginStatus);
