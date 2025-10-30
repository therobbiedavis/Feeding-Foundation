// --- Utility and parsers ---
        const STATE_NAME_TO_ABBR = {
            'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA','colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT','virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY','district of columbia':'DC'
        };

        function parseStateFromAddress(address){
            if (!address || typeof address !== 'string') return null;
            const txt = address.trim();
            let m = txt.match(/,\s*([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/);
            if (m && m[1]) return m[1].toUpperCase();
            m = txt.match(/,\s*([A-Za-z ]+?)\s*(?:\d{5}(?:-\d{4})?)?$/);
            if (m && m[1]){
                const name = m[1].toLowerCase().trim();
                if (STATE_NAME_TO_ABBR[name]) return STATE_NAME_TO_ABBR[name];
                const tokens = name.split(/\s+/);
                const lastTwo = tokens.slice(-2).join(' ');
                if (STATE_NAME_TO_ABBR[lastTwo]) return STATE_NAME_TO_ABBR[lastTwo];
                const lastOne = tokens.slice(-1)[0];
                if (STATE_NAME_TO_ABBR[lastOne]) return STATE_NAME_TO_ABBR[lastOne];
            }
            const abbrs = Object.values(STATE_NAME_TO_ABBR).join('|');
            const re = new RegExp('\\b(' + abbrs + ')\\b', 'i');
            m = txt.match(re);
            if (m && m[1]) return m[1].toUpperCase();
            return null;
        }

        function parseCityZipFromAddress(address){
            if (!address || typeof address !== 'string') return {city:null, zip:null};
            const m = address.match(/,\s*([^,]+),\s*([A-Za-z]{2}|[A-Za-z ]+)\s*(\d{5}(?:-\d{4})?)?$/);
            if (m){
                const city = m[1].trim();
                const zip = m[3] ? m[3].trim() : null;
                return {city, zip};
            }
            const m2 = address.match(/(\d{5}(?:-\d{4})?)/);
            return {city:null, zip: m2 ? m2[1] : null};
        }

        function parseCountyFromAddress(address){
            if (!address || typeof address !== 'string') return null;
            const m = address.match(/([A-Za-z][A-Za-z\s\-']+?)\s+County\b/i);
            if (m && m[1]) return m[1].trim();
            return null;
        }

        function normalizeCounty(name){
            if (!name || typeof name !== 'string') return null;
            let s = name.trim();
            s = s.replace(/\bCounty\b/i, '').trim();
            s = s.replace(/\s+/g, ' ');
            return s || null;
        }

        // --- Geocoding ---
        const GOOGLE_API_KEY = '[[GOOGLE_GEO_API_KEY]]'; // Replace with your actual Google Maps Geocoding API key to enable Google geocoding for better accuracy on missing fields

        async function geocodeNominatimClient(address){
            if (!address) throw new Error('No address');
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Feeding-Foundation-client/1.0 (github.com/therobbiedavis)' } });
            if (!res.ok) throw new Error('Nominatim request failed');
            const j = await res.json();
            if (!Array.isArray(j) || !j[0]) throw new Error('Nominatim no result');
            const it = j[0];
            // Nominatim returns different keys for populated places depending on region; check a broad set
            const a = it.address || {};
            // Prefer populated-place keys; do NOT use county as a fallback for 'city' (can be misleading on short addresses)
            const cityCandidate = a.city || a.town || a.municipality || a.village || a.hamlet || a.locality || a.city_district || a.suburb || a.neighbourhood || null;
            return {
                lat: parseFloat(it.lat),
                lng: parseFloat(it.lon),
                // expose multiple populated-place-like fields plus a best-effort 'city'
                city: cityCandidate,
                town: a.town || null,
                village: a.village || null,
                hamlet: a.hamlet || null,
                municipality: a.municipality || null,
                locality: a.locality || null,
                city_district: a.city_district || null,
                suburb: a.suburb || null,
                county: a.county || null,
                state: a.state ? (a.state.length === 2 ? a.state.toUpperCase() : a.state) : null,
                postcode: a.postcode || null,
                neighbourhood: a.neighbourhood || null
            };
        }

        async function geocodeGoogleClient(address){
            if (!address) throw new Error('No address');
            if (!GOOGLE_API_KEY) throw new Error('No Google API key');
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Google request failed');
            const j = await res.json();
            if (!j.results || !j.results[0]) throw new Error('Google no result');
            const r = j.results[0];
            const comps = {};
            if (Array.isArray(r.address_components)){
                r.address_components.forEach(c => {
                    // Try a series of component types that might represent the populated place (city/town)
                    if (c.types.includes('locality') || c.types.includes('postal_town') || c.types.includes('sublocality') || c.types.includes('neighborhood') || c.types.includes('administrative_area_level_3')) comps.city = comps.city || c.long_name;
                    if (c.types.includes('administrative_area_level_1')) comps.state = comps.state || c.short_name;
                    if (c.types.includes('administrative_area_level_2')) comps.county = comps.county || c.long_name;
                    if (c.types.includes('postal_code')) comps.postcode = comps.postcode || c.long_name;
                    if (c.types.includes('neighborhood') || c.types.includes('sublocality')) comps.neighbourhood = comps.neighbourhood || c.long_name;
                });
            }
            return {
                lat: r.geometry.location.lat,
                lng: r.geometry.location.lng,
                city: comps.city || null,
                county: comps.county || null,
                state: comps.state ? comps.state.toUpperCase() : null,
                postcode: comps.postcode || null,
                neighbourhood: comps.neighbourhood || null
            };
        }

        async function clientGeocodeAddress(address){
            const statusEl = document.getElementById('geocode-status');
            const spinnerEl = document.getElementById('geocode-spinner');
            if (statusEl) statusEl.textContent = 'Looking up...';
            if (spinnerEl) spinnerEl.style.display = 'inline-block';
            try{
                const nom = await geocodeNominatimClient(address);
                if (statusEl) statusEl.textContent = 'Found via Nominatim';
                if (spinnerEl) spinnerEl.style.display = 'none';
                return nom;
            }catch(nerr){
                try{
                    const g = await geocodeGoogleClient(address);
                    if (statusEl) statusEl.textContent = 'Found via Google';
                    if (spinnerEl) spinnerEl.style.display = 'none';
                    return g;
                }catch(gerr){
                    if (statusEl) statusEl.textContent = 'Geocode failed';
                    if (spinnerEl) spinnerEl.style.display = 'none';
                    throw new Error('All geocoders failed');
                }
            }
        }

        // --- Validation helpers ---
        function isValidStateAbbr(s){ return !!s && /^[A-Za-z]{2}$/.test(s.trim()); }
        function isValidZip(z){ return !!z && /^\d{5}$/.test(z.trim()); }
        function showFieldError(fieldEl, msg){ if (!fieldEl) return; clearFieldError(fieldEl); const err = document.createElement('div'); err.className = 'field-error'; err.style.color = '#b91c1c'; err.style.fontSize = '13px'; err.style.marginTop = '6px'; err.textContent = msg; fieldEl.parentNode.insertBefore(err, fieldEl.nextSibling); }
        function clearFieldError(fieldEl){ if (!fieldEl) return; const err = fieldEl.nextElementSibling; if (err && err.classList && err.classList.contains('field-error')) err.remove(); }

        // --- Main form logic ---
        let generatedLocationJSON = null;

        function generateLocationData(){
            const name = document.getElementById('name').value.trim();
            const address = document.getElementById('address').value.trim();
            const type = document.getElementById('type').value.trim();
            const description = document.getElementById('description').value.trim();
            const schedule = document.getElementById('schedule').value.trim();
            const website = document.getElementById('website').value.trim();
            const active = document.getElementById('active').checked;

            if (!name || !address || !type) { generatedLocationJSON = null; document.getElementById('json-preview') && (document.getElementById('json-preview').textContent = ''); return; }

            const parsed = parseCityZipFromAddress(address) || {};
            const parsedState = parseStateFromAddress(address) || '';
            const parsedCounty = parseCountyFromAddress(address) || '';

            const cityField = document.getElementById('city');
            const stateField = document.getElementById('state');
            const zipField = document.getElementById('zip');
            const countyField = document.getElementById('county');

            const finalCityRaw = (cityField && cityField.value.trim()) || parsed.city || '';
            const finalStateRaw = (stateField && stateField.value.trim()) || parsedState || '';
            const finalZip = (zipField && zipField.value.trim()) || parsed.zip || '';
            const finalCountyRaw = (countyField && countyField.value.trim()) || parsedCounty || '';

            const finalCity = toTitleCase(finalCityRaw);
            const finalState = normalizeStateAbbr(finalStateRaw);
            const finalCounty = toTitleCase(normalizeCounty(finalCountyRaw) || finalCountyRaw || '');

            const latField = document.getElementById('lat');
            const lngField = document.getElementById('lng');
            const lat = latField && latField.value ? parseFloat(latField.value) : null;
            const lng = lngField && lngField.value ? parseFloat(lngField.value) : null;

            const locationData = {
                name: name,
                type: type,
                address: address,
                city: finalCity || null,
                state: finalState || null,
                zip: finalZip || null,
                county: finalCounty || null,
                lat: lat,
                lng: lng,
                description: description || null,
                schedule: schedule || null,
                website: website || null,
                active: !!active
            };

            generatedLocationJSON = JSON.stringify(locationData, null, 2);
            const preview = document.getElementById('json-preview'); if (preview) preview.textContent = generatedLocationJSON;
        }

        function checkFormValidity(){
            const name = document.getElementById('name').value.trim();
            const address = document.getElementById('address').value.trim();
            const type = document.getElementById('type').value.trim();
            const submitBtn = document.querySelector('.btn-submit');
            if (name && address && type) submitBtn.removeAttribute('disabled'); else submitBtn.setAttribute('disabled', '');
        }

        // Debounced auto-geocode
        let geocodeTimer = null;
        const GEOCODE_DEBOUNCE_MS = 700;
        // Normalize helpers
        function toTitleCase(s){
            if (!s || typeof s !== 'string') return '';
            // Exceptions: map of lowercase token -> desired output
            const EXCEPTIONS = {
                'st': 'St.',
                'st.': 'St.',
                'la': 'la',
                'de': 'de',
                'van': 'van',
                'von': 'von',
                'le': 'le',
                'du': 'du',
                'da': 'da',
                'dos': 'dos',
                'das': 'das',
                'al': 'al',
                'el': 'el',
                "o'": "O'",
            };

            // Particles that are usually lowercased when not the first word
            const LOWERCASE_PARTICLES = new Set(['de','la','van','von','der','den','le','du','da','dos','das','el','al','bin','ibn']);

            // helper: capitalize while handling Mc/Mac prefixes
            function capitalizeWordWithPrefixes(w, isFirst){
                if (!w) return w;
                const lw = w.toLowerCase();
                if (EXCEPTIONS[lw] && (isFirst || EXCEPTIONS[lw] !== lw)) {
                    // If it's an exception and either it's first word or exception specifies different casing, use it
                    return EXCEPTIONS[lw];
                }
                // lowercase particle when not first
                if (!isFirst && LOWERCASE_PARTICLES.has(lw)) return lw;
                // Mc prefix: McDonald (capitalize following letter)
                if (lw.startsWith('mc') && lw.length > 2) {
                    return 'Mc' + lw.charAt(2).toUpperCase() + lw.slice(3);
                }
                // Mac prefix: MacArthur
                if (lw.startsWith('mac') && lw.length > 3) {
                    return 'Mac' + lw.charAt(3).toUpperCase() + lw.slice(4);
                }
                // default: capitalize first letter
                return lw.charAt(0).toUpperCase() + lw.slice(1);
            }

            // Split on separators but keep them (spaces, hyphens, slashes)
            const parts = s.trim().split(/([\s\-\/]+)/);
            // Determine first word index to treat particles correctly
            let wordIndex = 0;
            return parts.map(tok => {
                if (/^[\s\-\/]+$/.test(tok)) return tok;
                // handle apostrophes: O'neill -> O'Neill
                if (tok.indexOf("'") !== -1){
                    const sub = tok.split(/(')/).map(part => {
                        if (part === "'") return part;
                        const val = capitalizeWordWithPrefixes(part, wordIndex === 0);
                        wordIndex++;
                        return val;
                    }).join('');
                    return sub;
                }
                const val = capitalizeWordWithPrefixes(tok, wordIndex === 0);
                wordIndex++;
                return val;
            }).join('');
        }

        function normalizeStateAbbr(s){
            if (!s || typeof s !== 'string') return '';
            const t = s.trim();
            if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
            const k = t.toLowerCase();
            if (STATE_NAME_TO_ABBR[k]) return STATE_NAME_TO_ABBR[k];
            // last-resort: if it's a long name, try title-casing it
            return t.toUpperCase();
        }

        ['city','state','zip','county'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                el.dataset.manual = '1';
                generateLocationData();
                checkFormValidity();
            });
            el.addEventListener('blur', () => {
                // Normalize casing on blur; keep ZIP as-is
                if (id === 'city') el.value = toTitleCase(el.value);
                else if (id === 'county') el.value = toTitleCase(normalizeCounty(el.value) || el.value);
                else if (id === 'state') el.value = normalizeStateAbbr(el.value);
                else if (id === 'zip') el.value = el.value.trim();
                generateLocationData();
            });
        });

        function applyParsedAddressToFields(parsed, pState, pCounty){
            const cityField = document.getElementById('city');
            const stateField = document.getElementById('state');
            const zipField = document.getElementById('zip');
            const countyField = document.getElementById('county');
            if (cityField && !cityField.dataset.manual) {
                cityField.value = toTitleCase(parsed.city || '');
                cityField.removeAttribute('disabled');
            }
            if (stateField && !stateField.dataset.manual){
                stateField.value = normalizeStateAbbr(pState || '');
                stateField.removeAttribute('disabled');
            }
            if (zipField && !zipField.dataset.manual) {
                zipField.value = parsed.zip || '';
                zipField.removeAttribute('disabled');
            }
            if (countyField && !countyField.dataset.manual) {
                countyField.value = toTitleCase(normalizeCounty(pCounty) || (parsed.county || ''));
                countyField.removeAttribute('disabled');
            }
        }

        async function scheduleGeocodeForAddress(address){
            const statusEl = document.getElementById('geocode-status'); if (statusEl) statusEl.textContent = '';
            if (geocodeTimer) clearTimeout(geocodeTimer);
            geocodeTimer = setTimeout(async () => {
                if (!address) return;
                const cityField = document.getElementById('city');
                const stateField = document.getElementById('state');
                const zipField = document.getElementById('zip');
                const countyField = document.getElementById('county');
                try{
                    // Use a best-effort geocode: try Nominatim first, then supplement missing fields with Google
                    const res = await geocodeBestEffort(address);
                    const foundCity = res && (res.city || res.town || res.village || res.hamlet || res.neighbourhood || res.neighborhood || res.locality || res.neighbourhood);
                    if (foundCity && (!cityField.dataset.manual)) {
                        cityField.value = toTitleCase(foundCity);
                    }
                    cityField.removeAttribute('disabled');
                    if (res.state && (!stateField.dataset.manual)){
                        stateField.value = normalizeStateAbbr(res.state);
                    }
                    stateField.removeAttribute('disabled');
                    if (res.postcode && (!zipField.dataset.manual)) {
                        zipField.value = res.postcode;
                    }
                    zipField.removeAttribute('disabled');
                    if (res.county && (!countyField.dataset.manual)) {
                        countyField.value = toTitleCase(normalizeCounty(res.county) || countyField.value);
                    }
                    countyField.removeAttribute('disabled');
                    if (res.lat) document.getElementById('lat').value = res.lat;
                    if (res.lng) document.getElementById('lng').value = res.lng;
                    // Show the inferred fields section when inferring is complete
                    const fieldsDiv = document.getElementById('parsed-address-fields');
                    if (fieldsDiv && !fieldsDiv.classList.contains('expanded')) {
                        fieldsDiv.style.display = 'block';
                        // Use setTimeout to trigger the animation after display is set
                        setTimeout(() => { fieldsDiv.classList.add('expanded'); updateToggleHr(); }, 20);
                    } else {
                        updateToggleHr();
                    }
                    if (statusEl) statusEl.textContent = 'Prefilled fields from geocoder';
                }catch(err){ 
                    // Enable fields even if geocoding failed
                    cityField.removeAttribute('disabled');
                    stateField.removeAttribute('disabled');
                    zipField.removeAttribute('disabled');
                    countyField.removeAttribute('disabled');
                    // Show the inferred fields section even on failure since fields are enabled
                    const fieldsDiv = document.getElementById('parsed-address-fields');
                    if (fieldsDiv && !fieldsDiv.classList.contains('expanded')) {
                        fieldsDiv.style.display = 'block';
                        // Use setTimeout to trigger the animation after display is set
                        setTimeout(() => { fieldsDiv.classList.add('expanded'); updateToggleHr(); }, 20);
                    } else {
                        updateToggleHr();
                    }
                    if (statusEl) statusEl.textContent = 'Geocode failed'; 
                }
                generateLocationData(); checkFormValidity();
            }, GEOCODE_DEBOUNCE_MS);
        }

        // Best-effort geocoding: try Nominatim first (free), then supplement missing fields with Google as last resort
        async function geocodeBestEffort(address){
            const statusEl = document.getElementById('geocode-status');
            const spinnerEl = document.getElementById('geocode-spinner');
            if (statusEl) statusEl.textContent = 'Looking up...';
            if (spinnerEl) spinnerEl.style.display = 'inline-block';
            let nom = null;
            try{
                nom = await geocodeNominatimClient(address);
                if (statusEl) statusEl.textContent = 'Found via Nominatim';
            }catch(e){
                nom = null;
            }

            // Determine which fields are missing that we'd like to supplement
            const need = {
                city: !(nom && nom.city),
                state: !(nom && nom.state),
                postcode: !(nom && nom.postcode),
                county: !(nom && nom.county),
                latlng: !(nom && nom.lat && nom.lng)
            };

            let google = null;
            // If any core fields are missing, try a Nominatim reverse lookup (if we have coords) to extract more granular components
            async function tryReverseNominatim(lat, lng){
                try{
                    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`;
                    const r = await fetch(url, { headers: { 'User-Agent': 'Feeding-Foundation-client/1.0 (github.com/therobbiedavis)' } });
                    if (!r.ok) return null;
                    const j = await r.json();
                    console.log('Nominatim reverse result for', lat, ',', lng, ':', j);
                    return j && j.address ? j.address : null;
                }catch(_) { return null; }
            }

            if (need.city && nom && nom.lat && nom.lng){
                const rev = await tryReverseNominatim(nom.lat, nom.lng);
                if (rev){
                    console.log('Reverse address details:', rev);
                    // attempt to extract a better city-like field from reverse result
                    const revCity = rev.city || rev.town || rev.village || rev.municipality || rev.locality || rev.suburb || rev.neighbourhood || rev.city_district || null;
                    console.log('Extracted revCity:', revCity);
                    if (revCity) {
                        nom.city = revCity;
                        // also copy other useful fields if present
                        nom.county = nom.county || rev.county || null;
                        nom.postcode = nom.postcode || rev.postcode || null;
                        nom.state = nom.state || (rev.state ? (rev.state.length===2?rev.state.toUpperCase():rev.state) : null);
                    }
                }
            }

            // Recheck needs after reverse
            const stillNeed = {
                city: !(nom && nom.city),
                state: !(nom && nom.state),
                postcode: !(nom && nom.postcode),
                county: !(nom && nom.county),
                latlng: !(nom && nom.lat && nom.lng)
            };

            // Only use Google as last resort if fields are still missing and API key is available
            if ((stillNeed.city || stillNeed.state || stillNeed.postcode || stillNeed.county || stillNeed.latlng) && GOOGLE_API_KEY && GOOGLE_API_KEY !== 'YOUR_API_KEY'){
                try{
                    google = await geocodeGoogleClient(address);
                    if (statusEl) statusEl.textContent = 'Supplemented via Google';
                }catch(ge){
                    google = null;
                }
            } else if ((stillNeed.city || stillNeed.state || stillNeed.postcode || stillNeed.county || stillNeed.latlng) && (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_API_KEY') && statusEl){
                statusEl.textContent = nom ? 'Partial result (Google unavailable - no API key)' : 'Geocode failed (no API key)';
            }

            // Merge results: prefer nom values, supplement from google when missing
            const merged = {
                lat: (nom && nom.lat) || (google && google.lat) || null,
                lng: (nom && nom.lng) || (google && google.lng) || null,
                city: (nom && nom.city) || (nom && nom.town) || (nom && nom.village) || (nom && nom.locality) || (google && (google.city || google.neighbourhood)) || null,
                county: (nom && nom.county) || (google && google.county) || null,
                state: (nom && nom.state) || (google && google.state) || null,
                postcode: (nom && nom.postcode) || (google && google.postcode) || null,
                // keep the raw google/nominatim objects for debugging if needed
                _nom: nom,
                _google: google
            };
            console.log('Merged geocoding result:', merged);

            if (spinnerEl) spinnerEl.style.display = 'none';
            return merged;
        }

        document.getElementById('address').addEventListener('input', () => {
            // Populate simple parsed fields immediately
            const address = document.getElementById('address').value.trim();
            const parsed = parseCityZipFromAddress(address) || {};
            const pState = parseStateFromAddress(address) || '';
            const pCounty = parseCountyFromAddress(address) || '';
            applyParsedAddressToFields(parsed, pState, pCounty);
            scheduleGeocodeForAddress(address);
        });

        // If an address is prefilled on load (e.g., pasted or server-rendered), parse it and run geocode shortly after load
        window.addEventListener('load', () => {
            const initialAddress = document.getElementById('address').value.trim();
            if (initialAddress){
                const parsed = parseCityZipFromAddress(initialAddress) || {};
                const pState = parseStateFromAddress(initialAddress) || '';
                const pCounty = parseCountyFromAddress(initialAddress) || '';
                applyParsedAddressToFields(parsed, pState, pCounty);
                // schedule geocode quicker on load
                geocodeTimer = setTimeout(() => scheduleGeocodeForAddress(initialAddress), 300);
            }
        });

        // Wire inputs to live JSON preview and validation
        document.querySelectorAll('#location-form input, #location-form select, #location-form textarea').forEach(el => {
            el.addEventListener('input', () => { generateLocationData(); checkFormValidity(); });
        });

        // Submit handler
        document.getElementById('location-form').addEventListener('submit', function(e) {
            e.preventDefault();
            generateLocationData();
            if (!generatedLocationJSON) { alert('Please complete the required fields (Name, Address, Type).'); return; }
            const json = generatedLocationJSON;
            const githubBase = 'https://github.com/therobbiedavis/Feeding-Foundation/issues/new?template=add-location.yml&location-json=' + encodeURIComponent(json);
            window.open(githubBase, '_blank');
        });

        // Initialize
        document.getElementById('year').textContent = new Date().getFullYear();
        generateLocationData();
        checkFormValidity();

        // Manual toggle for additional fields
        const toggleHr = document.getElementById('toggle-fields-hr');
        const fieldsDiv = document.getElementById('parsed-address-fields');
        
        function updateToggleHr() {
            // Always keep the toggle visible so users can collapse after expansion
            const liveEl = document.getElementById('parsed-fields-status');
            if (fieldsDiv.classList.contains('expanded')) {
                toggleHr.classList.add('expanded');
                toggleHr.setAttribute('aria-expanded', 'true');
                toggleHr.title = 'Hide additional fields';
                // rotate the inner wrapper explicitly for cross-browser reliability
                const chevWrap = toggleHr.querySelector('.chev-wrap');
                if (chevWrap) chevWrap.classList.add('rotated');
                if (liveEl) liveEl.textContent = 'Additional fields expanded. City, State, ZIP, and County are now editable.';
            } else {
                toggleHr.classList.remove('expanded');
                toggleHr.setAttribute('aria-expanded', 'false');
                toggleHr.title = 'Show additional fields';
                const chevWrap = toggleHr.querySelector('.chev-wrap');
                if (chevWrap) chevWrap.classList.remove('rotated');
                if (liveEl) liveEl.textContent = 'Additional fields hidden.';
            }
            // Ensure visible regardless of auto/manual expansion state
            try { toggleHr.style.display = 'block'; } catch(e){}
        }
        
        toggleHr.addEventListener('click', () => {
            if (fieldsDiv.classList.contains('expanded')) {
                // Hide fields
                fieldsDiv.classList.remove('expanded');
                setTimeout(() => {
                    if (!fieldsDiv.classList.contains('expanded')) {
                        fieldsDiv.style.display = 'none';
                    }
                }, 400); // Match transition duration
            } else {
                // Show fields
                fieldsDiv.style.display = 'block';
                setTimeout(() => {
                    fieldsDiv.classList.add('expanded');
                    updateToggleHr();
                }, 20);
                return; // update already called after expansion
            }
            updateToggleHr();
        });
        
        // Note: expansion logic calls updateToggleHr() after auto-expansion so the chevron updates

        // small focus animation
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('focus', function() { this.parentElement.style.transform = 'translateX(4px)'; this.parentElement.style.transition = 'transform 0.2s ease'; });
            el.addEventListener('blur', function() { this.parentElement.style.transform = 'translateX(0)'; });
        });
