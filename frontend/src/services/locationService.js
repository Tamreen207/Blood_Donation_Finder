export async function getBrowserLocation() {
	if (!navigator.geolocation) {
		throw new Error('Geolocation is not supported by this browser.');
	}

	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			(error) => {
				if (error.code === error.PERMISSION_DENIED) {
					reject(new Error('Location permission was denied. Enter your location manually.'));
					return;
				}

				reject(new Error('Unable to determine your current location.'));
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
		);
	});
}
