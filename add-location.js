#!/usr/bin/env node
/*
  add-location.js
  - Helper script to add a new location to locations.json
  - Usage: node add-location.js <json-string>
  - Example: node add-location.js '{"name":"Test Location","type":"Food Pantry","address":"123 Main St","city":"Newnan","state":"GA","zip":"30263","county":"Coweta","description":"A test location","schedule":"Wed 10am-2pm","website":""}'
*/

const fs = require('fs');
const path = require('path');

const LOC_PATH = path.resolve(__dirname, 'locations.json');

function main() {
  const jsonString = process.argv[2];

  if (!jsonString) {
    console.error('Usage: node add-location.js <json-string>');
    console.error('Example: node add-location.js \'{"name":"Test Location","type":"Food Pantry","address":"123 Main St","city":"Newnan","state":"GA","zip":"30263","county":"Coweta","description":"A test location","schedule":"Wed 10am-2pm","website":""}\'');
    process.exit(1);
  }

  try {
    // Parse the JSON
    const newLocation = JSON.parse(jsonString);

    // Validate required fields
    const required = ['name', 'type', 'address', 'city', 'state', 'zip', 'county', 'description', 'schedule', 'website'];
    const missing = required.filter(field => !newLocation[field]);
    if (missing.length > 0) {
      console.error('Missing required fields:', missing.join(', '));
      process.exit(1);
    }

    // Ensure active field is set (default to true if not provided)
    if (newLocation.active === undefined) {
      newLocation.active = true;
    }

    // Ensure lat/lng are set to null if not provided
    newLocation.lat = newLocation.lat || null;
    newLocation.lng = newLocation.lng || null;

    // Read existing locations
    if (!fs.existsSync(LOC_PATH)) {
      console.error('locations.json not found');
      process.exit(1);
    }

    const raw = fs.readFileSync(LOC_PATH, 'utf8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data.locations)) {
      console.error('locations.json missing "locations" array');
      process.exit(1);
    }

    // Check if location already exists
    const exists = data.locations.some(loc =>
      loc.name.toLowerCase() === newLocation.name.toLowerCase() &&
      loc.address.toLowerCase() === newLocation.address.toLowerCase()
    );

    if (exists) {
      console.error('Location already exists in the database');
      process.exit(1);
    }

    // Add the new location
    data.locations.push(newLocation);

    // Write back to file
    fs.writeFileSync(LOC_PATH, JSON.stringify(data, null, 2), 'utf8');

    console.log('✅ Successfully added location:', newLocation.name);
    console.log('📍 Address:', newLocation.address);
    console.log('🏛️ County:', newLocation.county);
    console.log('📝 Type:', newLocation.type);
    console.log('\nNext steps:');
    console.log('1. Run the pregeocode script if coordinates are needed:');
    console.log('   node pregeocode.js --write');
    console.log('2. Commit and push the changes');
    console.log('3. Close the GitHub issue');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();