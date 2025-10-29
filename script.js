let map;
let geocoder;
let markers = [];
let infoWindows = [];
let geocodePromises = [];
let locationsData = [];
let selectedCounty = '';
let selectedType = '';

// Fallback for when Google Maps API fails to load
window.gm_authFailure = function() {
    console.error('Google Maps API authentication failed');
    showApiError();
};

// Fallback for when initMap is not called (script load failure)
window.addEventListener('load', function() {
    setTimeout(function() {
        if (typeof google === 'undefined' || !map) {
            console.warn('Google Maps API did not load properly');
            showApiError();
        }
    }, 3000); // Give it 3 seconds to load
});

function initMap() {
    // Check if Google Maps API loaded successfully
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        showApiError();
        return;
    }

    try {
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

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (event) => {
            const sidebar = document.getElementById('sidebar');
            const mobileToggle = document.getElementById('mobile-toggle');
            
            // Only close if sidebar is open and click is outside sidebar and not on toggle button
            if (sidebar.classList.contains('open') && 
                !sidebar.contains(event.target) && 
                !mobileToggle.contains(event.target)) {
                sidebar.classList.remove('open');
            }
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

        // Type selector
        const typeSelect = document.getElementById('type-select');
        typeSelect.addEventListener('change', () => {
            selectedType = typeSelect.value;
            filterLocations();
        });

        // Search input
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', () => {
            filterLocations();
        });

        // Load locations from JSON
        loadLocations();
    } catch (error) {
        console.error('Error initializing map:', error);
        showApiError();
    }
}

function loadLocations() {
    fetch('locations.json')
        .then(response => response.json())
        .then(data => {
            locationsData = data.locations || [];
            populateCountyDropdown(locationsData);
            populateTypeDropdown(locationsData);
            // Show all active locations on first load
            filterLocations();
        })
        .catch(error => console.error('Error loading locations:', error));
}

function populateLocations(list) {
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    
    if (list.length === 0) {
        if (selectedCounty || selectedType) {
            listEl.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--muted);"><p>No active locations found for the selected criteria.</p></div>';
        } else {
            listEl.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--muted);"><p>No active locations available.</p></div>';
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

            const locationJson = encodeURIComponent(JSON.stringify(location, null, 2));
            const infoContent = `
                <h3>${escapeHtml(location.name)}</h3>
                <p><strong>${escapeHtml(location.type)}</strong></p>
                <p>${escapeHtml(location.description || '')}</p>
                ${location.schedule ? `<p><em>${escapeHtml(location.schedule)}</em></p>` : ''}
                <p class="muted"><em>${escapeHtml(location.address || (location.lat+','+location.lng))}</em></p>
                <p><a href="${directionsLink}" target="_blank" rel="noopener">Directions</a></p>
                <p><a href="https://github.com/therobbiedavis/Feeding-Foundation/issues/new?template=report-inactive.yml&title=${encodeURIComponent('Report Inactive: ' + location.name)}&location-json=${locationJson}" target="_blank" rel="noopener">Report inactive / closed</a></p>
            `;

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
    const locationJson = encodeURIComponent(JSON.stringify(location, null, 2));
    const el = document.createElement('div');
    el.className = 'location-item';
    el.dataset.index = idx;
    el.innerHTML = `
        <div class="location-name">${escapeHtml(location.name)}</div>
        <div class="location-type" style="font-size: 13px; color: var(--accent-3); font-weight: 600; margin-bottom: 4px;">${escapeHtml(location.type)}</div>
        <div class="location-address">${escapeHtml(location.address)}</div>
        ${location.schedule ? `<div style="font-size: 13px; color: var(--muted); margin: 4px 0; font-style: italic;">${escapeHtml(location.schedule)}</div>` : ''}
        <div style="margin-top:8px;font-size:13px;">
            <a href="https://github.com/therobbiedavis/Feeding-Foundation/issues/new?template=report-inactive.yml&title=${encodeURIComponent('Report Inactive: ' + location.name)}&location-json=${locationJson}" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600;">Report inactive</a>
        </div>
    `;
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
    
    // Filter by active status first
    filtered = filtered.filter(loc => loc.active !== false);
    
    // Filter by county if selected
    if (selectedCounty) {
        filtered = filtered.filter(loc => loc.county === selectedCounty);
    }
    
    // Filter by type if selected
    if (selectedType) {
        filtered = filtered.filter(loc => loc.type === selectedType);
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

// Schedule parsing and "open now" functionality
function parseSchedule(scheduleText) {
    if (!scheduleText || typeof scheduleText !== 'string') {
        return null;
    }

    const text = scheduleText.toLowerCase().trim();

    // Handle 24/7 locations
    if (text.includes('24/7') || text.includes('24 hours') || text.includes('always open')) {
        return { type: 'always' };
    }

    // Handle "by appointment" or similar
    if (text.includes('appointment') || text.includes('call first') || text.includes('contact')) {
        return { type: 'appointment' };
    }

    // Try to parse day and time information
    const schedule = { type: 'scheduled', days: [], times: [] };

    // Common day patterns
    const dayPatterns = {
        'monday': ['monday', 'mon'],
        'tuesday': ['tuesday', 'tues', 'tue'],
        'wednesday': ['wednesday', 'wed'],
        'thursday': ['thursday', 'thurs', 'thu'],
        'friday': ['friday', 'fri'],
        'saturday': ['saturday', 'sat'],
        'sunday': ['sunday', 'sun']
    };

    // Check for each day
    Object.keys(dayPatterns).forEach(day => {
        const patterns = dayPatterns[day];
        if (patterns.some(pattern => text.includes(pattern))) {
            schedule.days.push(day);
        }
    });

    // If no specific days mentioned, assume daily
    if (schedule.days.length === 0) {
        schedule.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    }

    // Parse time ranges (basic implementation)
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/g;
    let match;
    while ((match = timeRegex.exec(text)) !== null) {
        const startHour = parseInt(match[1]);
        const startMinute = match[2] ? parseInt(match[2]) : 0;
        const startPeriod = match[3];
        const endHour = parseInt(match[4]);
        const endMinute = match[5] ? parseInt(match[5]) : 0;
        const endPeriod = match[6];

        // Convert to 24-hour format
        let start24 = startHour;
        let end24 = endHour;

        if (startPeriod === 'pm' && startHour !== 12) start24 += 12;
        if (startPeriod === 'am' && startHour === 12) start24 = 0;
        if (endPeriod === 'pm' && endHour !== 12) end24 += 12;
        if (endPeriod === 'am' && endHour === 12) end24 = 0;

        schedule.times.push({
            start: start24 * 60 + startMinute,
            end: end24 * 60 + endMinute
        });
    }

    // If no times found but days were specified, assume it's a complex schedule we can't parse
    if (schedule.times.length === 0 && schedule.days.length < 7) {
        return { type: 'complex', original: scheduleText };
    }

    // If no times found and all days, assume it's always open during business hours or similar
    if (schedule.times.length === 0) {
        return { type: 'unknown', original: scheduleText };
    }

    return schedule;
}

function isLocationOpenNow(scheduleText) {
    const schedule = parseSchedule(scheduleText);
    if (!schedule) return null;

    const now = new Date();
    const currentDay = now.toLocaleLowerCase().substring(0, 3); // 'mon', 'tue', etc.
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    switch (schedule.type) {
        case 'always':
            return true;
        case 'appointment':
            return null; // Unknown - requires appointment
        case 'complex':
        case 'unknown':
            return null; // Can't determine
        case 'scheduled':
            // Check if current day is in schedule
            const dayMap = {
                'mon': 'monday',
                'tue': 'tuesday',
                'wed': 'wednesday',
                'thu': 'thursday',
                'fri': 'friday',
                'sat': 'saturday',
                'sun': 'sunday'
            };

            const fullDayName = dayMap[currentDay];
            if (!schedule.days.includes(fullDayName)) {
                return false;
            }

            // Check if current time is within any time range
            return schedule.times.some(timeRange => {
                return currentMinutes >= timeRange.start && currentMinutes <= timeRange.end;
            });

        default:
            return null;
    }
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

function showApiError() {
    const errorEl = document.getElementById('api-error');
    const mapEl = document.getElementById('map');
    const listEl = document.getElementById('list');

    // Show the error message
    errorEl.classList.remove('hidden');

    // Hide the map
    mapEl.style.display = 'none';

    // Update the locations list to indicate map is unavailable
    listEl.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--muted);"><p>Map functionality is currently unavailable. You can still browse location details below.</p></div>';

    // Still show locations in the list for accessibility
    const activeLocations = locationsData.filter(loc => loc.active !== false);
    if (activeLocations.length > 0) {
        const listContainer = document.createElement('div');
        listContainer.style.padding = '20px 0';
        activeLocations.forEach(location => {
            const item = document.createElement('div');
            item.className = 'location-item';
            item.innerHTML = `
                <div class="location-name">${escapeHtml(location.name)}</div>
                <div class="location-type" style="font-size: 13px; color: var(--accent-3); font-weight: 600; margin-bottom: 4px;">${escapeHtml(location.type)}</div>
                <div class="location-address">${escapeHtml(location.address)}</div>
                ${location.schedule ? `<div style="font-size: 13px; color: var(--muted); margin: 4px 0; font-style: italic;">${escapeHtml(location.schedule)}</div>` : ''}
                <div style="margin-top: 8px; font-size: 14px; color: var(--muted);">
                    ${escapeHtml(location.description || 'No description available')}
                </div>
            `;
            listContainer.appendChild(item);
        });
        listEl.appendChild(listContainer);
    }
}

function populateCountyDropdown(locations) {
    const countySelect = document.getElementById('county-select');

    // Get unique counties from active locations and sort them
    const counties = [...new Set(
        locations
            .filter(loc => loc.active !== false)
            .map(loc => loc.county)
            .filter(county => county)
    )].sort();

    // Clear existing options except the first one
    while (countySelect.options.length > 1) {
        countySelect.remove(1);
    }

    // Add county options
    counties.forEach(county => {
        const option = document.createElement('option');
        option.value = county;
        option.textContent = `${county} County`;
        countySelect.appendChild(option);
    });
}

function populateTypeDropdown(locations) {
    const typeSelect = document.getElementById('type-select');

    // Get unique types from active locations and sort them
    const types = [...new Set(
        locations
            .filter(loc => loc.active !== false)
            .map(loc => loc.type)
            .filter(type => type)
    )].sort();

    // Clear existing options except the first one
    while (typeSelect.options.length > 1) {
        typeSelect.remove(1);
    }

    // Add type options
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}