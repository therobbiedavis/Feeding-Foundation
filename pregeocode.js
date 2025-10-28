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
    const loc = j.results[0].geometry.location;
    return {lat: loc.lat, lng: loc.lng};
  }
  throw new Error(`Google geocode failed: ${j.status} ${j.error_message||''}`);
}

async function geocodeNominatim(address){
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, {headers: {'User-Agent':'Feeding-Foundation-geocoder/1.0 (github.com/therobbiedavis)'}});
  const j = await res.json();
  if (Array.isArray(j) && j[0]){
    return {lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon)};
  }
  throw new Error('Nominatim returned no results');
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
    if (loc.lat != null && loc.lng != null){
      console.log(`${i+1}. ${loc.name} — already has lat/lng`);
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
      } else if (useNominatim){
        coords = await geocodeNominatim(loc.address);
        // Nominatim policy: max 1 request per second
        await sleep(1100);
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
    fs.writeFileSync(LOC_PATH, JSON.stringify(out, null, 2), 'utf8');
    console.log('Overwrote', LOC_PATH);
  } else {
    console.log('Run with --write to overwrite locations.json with the pre-geocoded results');
  }
}

main().catch(err=>{console.error(err);process.exit(1)});
