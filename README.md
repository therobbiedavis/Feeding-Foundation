# Feeding Foundation

A static website that displays food locations on a Google Map using data from a JSON file.

## Setup

1. Obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Maps JavaScript API and Geocoding API for your project.
3. In your GitHub repository settings, go to Secrets and Variables > Actions, and add a new repository secret named `GOOGLE_MAPS_API_KEY` with your API key as the value.
4. Enable GitHub Pages in your repository settings (under Pages, set source to "GitHub Actions").

The deployment workflow will automatically inject the API key and deploy the site.

## Pre-geocoding addresses (recommended)

For production reliability and to reduce geocoding quota usage, pre-geocode your addresses and store `lat`/`lng` in `locations.json`.

I added a helper script `pregeocode.js` that can batch-geocode addresses and write `locations.pregeo.json` (or overwrite `locations.json`).

Usage examples:

- Using Google Geocoding API (recommended):

    1. Set your API key in the environment:

         ```bash
         export GOOGLE_MAPS_API_KEY="YOUR_KEY"
         ```

    2. Run the script and overwrite `locations.json` with geocoded coords:

         ```bash
         node pregeocode.js --write
         ```

- Using OpenStreetMap Nominatim (small datasets, rate-limited):

    ```bash
    node pregeocode.js --use-nominatim --write
    ```

Notes:
- Google is recommended for production use. Keep the API key secret (use GitHub Actions secrets for CI).
- Nominatim is public and rate-limited; follow their usage policy and prefer it only for small datasets or testing.

After pre-geocoding, the app will automatically use any `lat`/`lng` fields present in `locations.json` instead of calling the Geocoding API at runtime.

## Usage

- Open `index.html` in a web browser to view the map with all active food locations.
- Use the county dropdown to filter locations by a specific county, or leave it as "All Counties" to view all locations.
- The county dropdown is automatically populated with counties that have active locations in the database.
- Use the search box to find locations by name or address.
- Click on location markers or list items to view details and get directions.

## File Structure

- `index.html`: Main HTML page with map and location list
- `add-location.html`: Form for community members to submit new locations
- `styles.css`: CSS styles for all pages
- `script.js`: JavaScript for map initialization and location loading
- `add-location.js`: Helper script for processing location submissions
- `pregeocode.js`: Script for batch geocoding addresses
- `locations.json`: JSON file containing location data
- `.github/ISSUE_TEMPLATES/add-location.yml`: GitHub issue template for location submissions

## Adding Locations

### For Users (Community Submissions)

Anyone can submit new locations through our web form:

1. Visit the "Add Location" page from the main site
2. Fill out the location details form
3. Generate the JSON data
4. Copy the JSON and submit it as a [GitHub issue](https://github.com/therobbiedavis/Feeding-Foundation/issues/new/choose)

A maintainer will review and add approved locations to the database.

### For Maintainers

Edit `locations.json` to add new locations. Each location should have:

```json
{
  "name": "Location Name",
  "address": "Full street address, City, State, ZIP",
  "county": "County Name",
  "type": "Location Type",
  "description": "Brief description",
  "active": true,
  "lat": null,
  "lng": null
}
```

#### Using the Helper Script

For processing community submissions from GitHub issues:

```bash
node add-location.js '{"name":"New Location","address":"123 Main St","county":"Coweta","type":"Food Bank","description":"Community food bank"}'
```

This will validate and add the location to `locations.json`.

#### Required Fields:
- `name`: Location name
- `address`: Full address
- `county`: County name
- `type`: Location type

#### Optional Fields:
- `description`: Brief description
- `active`: Boolean indicating if location is operational (default: true)
- `lat`/`lng`: Coordinates (will be auto-geocoded if not provided)

#### Location Types:
- `Little Free Pantry`
- `Food Bank`
- `Soup Kitchen`
- `Community Garden`
- `Farmers Market`
- `Other`

#### Managing Inactive Locations

To mark a location as inactive (e.g., if it closes), set the `active` field to `false`:

```json
{
  "name": "Old Location",
  "active": false,
  ...
}
```

Inactive locations will not appear on the map or in search results.

## Hosting

This website is configured for automatic deployment to GitHub Pages. Once you set up the API key secret and enable Pages, pushes to the main branch will trigger deployment.

Alternatively, you can host it on other static site hosts like Netlify or Vercel by uploading the files directly.