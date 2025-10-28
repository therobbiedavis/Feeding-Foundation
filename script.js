let map;
let geocoder;
let markers = [];
let infoWindows = [];
let geocodePromises = [];
let locationsData = [];
let selectedCounty = '';

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

    // County selector
    const countySelect = document.getElementById('county-select');
    countySelect.addEventListener('change', () => {
        selectedCounty = countySelect.value;
        updateBranding(selectedCounty);
        filterLocations();
    });

    // Search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', () => {
        filterLocations();
    });

    // Load locations from JSON
    loadLocations();
}

function loadLocations() {
    fetch('locations.json')
        .then(response => response.json())
        .then(data => {
            locationsData = data.locations || [];
            // Don't populate locations initially - wait for county selection
            showCountyPrompt();
        })
        .catch(error => console.error('Error loading locations:', error));
}

function populateLocations(list) {
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    
    if (list.length === 0) {
        if (selectedCounty) {
            listEl.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--muted);"><p>No locations found for the selected criteria.</p></div>';
        } else {
            showCountyPrompt();
        }
        return;
    }
    
    const bounds = new google.maps.LatLngBounds();

    // reset arrays
    markers = [];
    infoWindows = [];
    geocodePromises = [];

    list.forEach((location, idx) => {
        // create list item immediately so UI is responsive
        const item = makeListItem(location, idx);
        listEl.appendChild(item);

        // Decide whether to use pre-geocoded coords or geocode the address
        let geocodePromise;
        if (location.lat != null && location.lng != null) {
            // use provided coordinates
            const latLng = new google.maps.LatLng(location.lat, location.lng);
            geocodePromise = Promise.resolve(latLng);
        } else {
            // show loading indicator on the list item while geocoding
            item.classList.add('loading');
            geocodePromise = geocodeAddress(location.address).then(latLng => {
                // remove loading indicator when we have a result
                item.classList.remove('loading');
                return latLng;
            }).catch(err => {
                item.classList.remove('loading');
                item.classList.add('failed');
                throw err;
            });
        }

        const p = geocodePromise.then(latLng => {
            const marker = new google.maps.Marker({
                position: latLng,
                map: map,
                title: location.name
            });
            markers[idx] = marker;

            const dest = latLng.lat && latLng.lng ? `${latLng.lat()},${latLng.lng()}` : encodeURIComponent(location.address);
            const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;

            const infoContent = `<h3>${escapeHtml(location.name)}</h3><p>${escapeHtml(location.description || '')}</p><p class="muted"><em>${escapeHtml(location.address || (location.lat+','+location.lng))}</em></p><p><a href="${directionsLink}" target="_blank" rel="noopener">Directions</a></p>`;

            const info = new google.maps.InfoWindow({
                content: infoContent
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
        }).catch(err => {
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

function filterLocations() {
    const searchQuery = document.getElementById('search').value.trim().toLowerCase();
    
    let filtered = locationsData;
    
    // Filter by county if selected
    if (selectedCounty) {
        filtered = filtered.filter(loc => loc.county === selectedCounty);
    } else {
        // If no county selected, show no locations
        filtered = [];
    }
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(loc => {
            return loc.name.toLowerCase().includes(searchQuery) || 
                   (loc.address && loc.address.toLowerCase().includes(searchQuery));
        });
    }
    
    clearMarkers();
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

function updateBranding(county) {
    const titleEl = document.querySelector('.site-title');
    const taglineEl = document.querySelector('.tagline');
    const heroTitleEl = document.querySelector('.hero-inner h2');
    
    if (county) {
        titleEl.textContent = `${county} County Chapter`;
        taglineEl.textContent = `Feeding Foundation - ${county} County`;
        heroTitleEl.textContent = `Find local food resources in ${county} County`;
    } else {
        titleEl.textContent = 'Feeding Foundation';
        taglineEl.textContent = 'Connecting communities with food resources';
        heroTitleEl.textContent = 'Find local food resources near you';
    }
}

function showCountyPrompt() {
    const listEl = document.getElementById('list');
    listEl.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--muted);"><p>Select a county above to view available locations.</p></div>';
}