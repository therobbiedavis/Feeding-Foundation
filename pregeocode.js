#!/usr/bin/env node
/*
  pregeocode.js
  - Reads locations.json
  - For entries missing lat/lng, queries a geocoding provider and writes locations.pregeo.json
  Usage:
    # Using Google Geocoding API (recommended). Set env var GOOGLE_MAPS_API_KEY.
    node pregeocode.js --write

    # Use OpenStreetMap Nominatim (public, rate-limited). Add --use-nominatim and --write
    node pregeocode.js --use-nominatim --write

  Notes:
  - Google is recommended for production; keep the API key secret.
  - Nominatim has strict usage policies: https://operations.osmfoundation.org/policies/nominatim/
*/

const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const LOC_PATH = path.resolve(__dirname, 'locations.json');
const OUT_PATH = path.resolve(__dirname, 'locations.pregeo.json');

const args = process.argv.slice(2);
const useNominatim = args.includes('--use-nominatim');
const doWrite = args.includes('--write');
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

function sleep(ms){return new Promise(res=>setTimeout(res, ms));}

async function geocodeGoogle(address){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status === 'OK' && j.results && j.results[0]){
    const r = j.results[0];
    const loc = r.geometry.location;
    // extract useful components by type
    const comps = {};
    if (Array.isArray(r.address_components)){
      r.address_components.forEach(c => {
        if (c.types.includes('locality') || c.types.includes('postal_town')) comps.city = comps.city || c.long_name;
        if (c.types.includes('administrative_area_level_1')) comps.state = comps.state || c.short_name;
        if (c.types.includes('administrative_area_level_2')) comps.county = comps.county || c.long_name;
        if (c.types.includes('postal_code')) comps.postcode = comps.postcode || c.long_name;
      });
    }
    return {lat: loc.lat, lng: loc.lng, components: comps};
  }
  throw new Error(`Google geocode failed: ${j.status} ${j.error_message||''}`);
}

async function geocodeNominatim(address){
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {headers: {'User-Agent':'Feeding-Foundation-geocoder/1.0 (github.com/therobbiedavis)'}});
  const j = await res.json();
  if (Array.isArray(j) && j[0]){
    const item = j[0];
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const comps = (item.address) ? {
      city: item.address.city || item.address.town || item.address.village || item.address.hamlet || null,
      county: item.address.county || null,
      state: item.address.state ? (item.address.state.length === 2 ? item.address.state.toUpperCase() : null) : null,
      postcode: item.address.postcode || null
    } : {};
    // Attempt to convert full state name to abbreviation later in main if needed
    return {lat, lng, components: comps};
  }
  throw new Error('Nominatim returned no results');
}

async function reverseGeocodeGoogle(lat, lng){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lng)}&key=${apiKey}`;
  const res = await fetch(url);
  const j = await res.json();
  if (j.status === 'OK' && j.results && j.results[0]){
    const r = j.results[0];
    const comps = {};
    if (Array.isArray(r.address_components)){
      r.address_components.forEach(c => {
        if (c.types.includes('locality') || c.types.includes('postal_town')) comps.city = comps.city || c.long_name;
        if (c.types.includes('administrative_area_level_1')) comps.state = comps.state || c.short_name;
        if (c.types.includes('administrative_area_level_2')) comps.county = comps.county || c.long_name;
        if (c.types.includes('postal_code')) comps.postcode = comps.postcode || c.long_name;
      });
    }
    return {components: comps};
  }
  throw new Error(`Google reverse geocode failed: ${j.status} ${j.error_message||''}`);
}

async function reverseGeocodeNominatim(lat, lng){
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`;
  const res = await fetch(url, {headers: {'User-Agent':'Feeding-Foundation-geocoder/1.0 (github.com/therobbiedavis)'}});
  const j = await res.json();
  if (j && j.address){
    const comps = {
      city: j.address.city || j.address.town || j.address.village || j.address.hamlet || null,
      county: j.address.county || null,
      state: j.address.state ? (j.address.state.length === 2 ? j.address.state.toUpperCase() : j.address.state) : null,
      postcode: j.address.postcode || null
    };
    return {components: comps};
  }
  throw new Error('Nominatim reverse returned no results');
}

// Mapping of US state names to their USPS abbreviations (lowercase keys)
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
  if (!address || typeof address !== 'string') return {city:null, postcode:null};
  // Attempt to capture ", City, ST ZIP" or ", City, StateName ZIP"
  const m = address.match(/,\s*([^,]+),\s*([A-Za-z]{2}|[A-Za-z ]+)\s*(\d{5}(?:-\d{4})?)?$/);
  if (m){
    const city = m[1].trim();
    const postcode = m[3] ? m[3].trim() : null;
    return {city, postcode};
  }
  // Fallback: try to find ZIP anywhere
  const m2 = address.match(/(\d{5}(?:-\d{4})?)/);
  return {city:null, postcode: m2 ? m2[1] : null};
}

async function main(){
  if (!fs.existsSync(LOC_PATH)){
    console.error('locations.json not found at', LOC_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(LOC_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.locations)){
    console.error('locations.json missing "locations" array');
    process.exit(1);
  }

  console.log(`Found ${data.locations.length} locations`);

  const out = {locations: []};

  for (let i=0;i<data.locations.length;i++){
    const loc = Object.assign({}, data.locations[i]);
    // Ensure structured address pieces are present if possible
    if ((!loc.state || !loc.city || !loc.zip) && loc.address){
      // Try to parse from address first
      try{
        const s = parseStateFromAddress(loc.address);
        if (s && !loc.state) loc.state = s;
      }catch(e){}
      try{
        const c = parseCityZipFromAddress(loc.address);
        if (c.city && !loc.city) loc.city = c.city;
        if (c.postcode && !loc.zip) loc.zip = c.postcode;
      }catch(e){}
    }

    if (loc.lat != null && loc.lng != null){
      // Already have coordinates — but if structured address pieces are missing, try reverse-geocoding to fill them
      if ((!loc.state || !loc.city || !loc.zip) && (apiKey || useNominatim)){
        console.log(`${i+1}. ${loc.name} — has lat/lng, attempting reverse-geocode to fetch city/state/zip`);
        try{
          let rev;
          if (apiKey){
            rev = await reverseGeocodeGoogle(loc.lat, loc.lng);
            // small delay
            await sleep(150);
          } else if (useNominatim){
            rev = await reverseGeocodeNominatim(loc.lat, loc.lng);
            await sleep(1100);
          }
          if (rev && rev.components){
            const c = rev.components;
            if (c.city && !loc.city) loc.city = c.city;
            if (c.postcode && !loc.zip) loc.zip = c.postcode;
            if (c.county && !loc.county) loc.county = c.county;
            if (c.state && !loc.state){
              const s = c.state;
              if (s.length === 2) loc.state = s.toUpperCase();
              else {
                const abbr = STATE_NAME_TO_ABBR[s.toLowerCase()];
                if (abbr) loc.state = abbr;
              }
            }
          }
        }catch(err){
          console.warn('  Reverse geocode failed:', err && err.message ? err.message : err);
        }
      } else {
        console.log(`${i+1}. ${loc.name} — already has lat/lng`);
      }
      out.locations.push(loc);
      continue;
    }

    if (!loc.address){
      console.warn(`${i+1}. ${loc.name} — no address and no lat/lng, skipping`);
      out.locations.push(loc);
      continue;
    }

    console.log(`${i+1}. ${loc.name} — geocoding address: ${loc.address}`);
    try{
      let coords;
      if (apiKey){
        coords = await geocodeGoogle(loc.address);
        // small delay to be polite
        await sleep(150);
        // If components were returned, populate structured fields
        if (coords.components){
          const c = coords.components;
          if (c.city && !loc.city) loc.city = c.city;
          if (c.postcode && !loc.zip) loc.zip = c.postcode;
          if (c.county && !loc.county) loc.county = c.county;
          if (c.state && !loc.state){
            // c.state is expected to be short_name already for Google
            loc.state = c.state.toUpperCase();
          }
        }
      } else if (useNominatim){
        coords = await geocodeNominatim(loc.address);
        // Nominatim policy: max 1 request per second
        await sleep(1100);
        if (coords.components){
          const c = coords.components;
          if (c.city && !loc.city) loc.city = c.city;
          if (c.postcode && !loc.zip) loc.zip = c.postcode;
          if (c.county && !loc.county) loc.county = c.county;
          if (c.state && !loc.state){
            // If state is full name, convert; if already abbr, keep
            const s = c.state;
            if (s && s.length === 2) loc.state = s.toUpperCase();
            else if (s){
              const abbr = STATE_NAME_TO_ABBR[s.toLowerCase()];
              if (abbr) loc.state = abbr;
            }
          }
        }
      } else {
        console.warn('No GOOGLE_MAPS_API_KEY present and --use-nominatim not specified. Skipping geocode.');
        out.locations.push(loc);
        continue;
      }

      loc.lat = coords.lat;
      loc.lng = coords.lng;
      console.log(` -> ${loc.lat}, ${loc.lng}`);
      out.locations.push(loc);
    }catch(err){
      console.error('  Geocode error:', err.message || err);
      out.locations.push(loc);
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', OUT_PATH);
  if (doWrite){
    // create a timestamped backup before overwriting
    try{
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const backupPath = LOC_PATH + `.backup.${ts}.json`;
      fs.copyFileSync(LOC_PATH, backupPath);
      console.log('Backed up', LOC_PATH, '->', backupPath);
    }catch(err){
      console.error('Failed to create backup of', LOC_PATH, err);
      console.error('Aborting overwrite to avoid data loss.');
      process.exit(1);
    }

    fs.writeFileSync(LOC_PATH, JSON.stringify(out, null, 2), 'utf8');
    console.log('Overwrote', LOC_PATH);
  } else {
    console.log('Run with --write to overwrite locations.json with the pre-geocoded results');
  }
}

main().catch(err=>{console.error(err);process.exit(1)});
