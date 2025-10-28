let map;
let geocoder;
let markers = [];
let infoWindows = [];
let geocodePromises = [];
let locationsData = [];

function initMap() {
    // Initialize the map centered on a default location
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
        zoom: 4,
        mapTypeControl: false
    });

    // Initialize geocoder
    geocoder = new google.maps.Geocoder();

    // Wire mobile toggle
    document.getElementById('mobile-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Set current year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        filterLocations(q);
    });

    // Load locations from JSON
    loadLocations();
}

function loadLocations() {
    fetch('locations.json')
        .then(response => response.json())
        .then(data => {
            locationsData = data.locations || [];
            clearMarkers();
            populateLocations(locationsData);
        })
        .catch(error => console.error('Error loading locations:', error));
}

function populateLocations(list) {
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    const bounds = new google.maps.LatLngBounds();

    // reset arrays
    markers = [];
    infoWindows = [];
    geocodePromises = [];

    list.forEach((location, idx) => {
        // create list item immediately so UI is responsive
        const item = makeListItem(location, idx);
        listEl.appendChild(item);

        // start geocoding and keep a promise per index
        const p = geocodeAddress(location.address)
            .then(latLng => {
                const marker = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    title: location.name
                });
                markers[idx] = marker;

                const info = new google.maps.InfoWindow({
                    content: `<h3>${location.name}</h3><p>${location.description || ''}</p><p><em>${location.address}</em></p>`
                });
                infoWindows[idx] = info;

                marker.addListener('click', () => {
                    closeAllInfoWindows();
                    info.open(map, marker);
                    highlightListItem(idx);
                    // close sidebar on mobile
                    document.getElementById('sidebar').classList.remove('open');
                });

                bounds.extend(latLng);
            })
            .catch(err => {
                console.error('Geocode failed for', location.address, err);
                markers[idx] = null;
                infoWindows[idx] = null;
            });

        geocodePromises[idx] = p;
    });

    // when all geocoding attempts settle, fit bounds
    Promise.allSettled(geocodePromises).then(() => {
        if (!bounds.isEmpty()) map.fitBounds(bounds);
    });
}

function makeListItem(location, idx) {
    const el = document.createElement('div');
    el.className = 'location-item';
    el.dataset.index = idx;
    el.innerHTML = `<div class="location-name">${escapeHtml(location.name)}</div><div class="location-address">${escapeHtml(location.address)}</div>`;
    el.addEventListener('click', () => {
        openLocation(idx).catch(err => {
            console.warn('Could not open location:', err);
            // fallback: try to geocode then center map
            geocodeAddress(location.address)
                .then(latLng => {
                    map.panTo(latLng);
                    map.setZoom(14);
                    document.getElementById('sidebar').classList.remove('open');
                })
                .catch(() => alert('Location could not be found.'));
        });
    });
    return el;
}

function openLocation(idx) {
    // Wait for geocoding to finish for this index
    const p = geocodePromises[idx] || Promise.reject(new Error('No geocode promise'));
    return p.then(() => {
        const marker = markers[idx];
        const info = infoWindows[idx];
        if (!marker) return Promise.reject(new Error('Marker not available'));
        map.panTo(marker.getPosition());
        map.setZoom(Math.max(map.getZoom(), 14));
        closeAllInfoWindows();
        if (info) info.open(map, marker);
        highlightListItem(idx);
        document.getElementById('sidebar').classList.remove('open');
        return Promise.resolve();
    });
}

function highlightListItem(idx) {
    const items = document.querySelectorAll('.location-item');
    items.forEach(it => it.classList.remove('active'));
    const el = document.querySelector(`.location-item[data-index='${idx}']`);
    if (el) el.classList.add('active');
}

function filterLocations(query) {
    const lower = query.toLowerCase();
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    // hide all markers
    markers.forEach(m => m.setMap(null));
    markers = [];
    infoWindows = [];

    const filtered = locationsData.filter(loc => {
        return loc.name.toLowerCase().includes(lower) || (loc.address && loc.address.toLowerCase().includes(lower));
    });

    populateLocations(filtered);
}

function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                resolve(results[0].geometry.location);
            } else {
                reject(new Error(`Geocode was not successful: ${status}`));
            }
        });
    });
}

function closeAllInfoWindows() {
    infoWindows.forEach(iw => iw.close());
}

function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    infoWindows = [];
}

function escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}