![Feeding Foundation Logo](imgs/logo-min.png)

Feeding Foundation is a small community-driven project that maps local food resources — food banks, pantries, soup kitchens, community gardens, and farmers markets — to help residents find support near them.

## Mission

Feeding Foundation's mission is to connect people in need with nearby food resources by maintaining an easy-to-use, community-curated map of services and drop-off points. We prioritize accuracy, accessibility, and community contributions.

## Quick links

- Live site: (deployed via GitHub Pages)
- Add a location: `add-location.html`
- Submit via GitHub issue: `https://github.com/therobbiedavis/Feeding-Foundation/issues/new/choose`

## How it's built

- Static HTML/CSS/JavaScript (no backend required for viewing)
- Google Maps JavaScript API for maps and markers
- Optional pre-geocoding step with `pregeocode.js` to store `lat`/`lng` in `locations.json`
- GitHub Actions workflow for safe API key injection and deployment to GitHub Pages

### Tech stack

- HTML5, CSS3 (custom properties and responsive layout)
- Vanilla JavaScript for map and UI logic
- Google Maps JavaScript API & Geocoding API

## Setup

### Production (GitHub Pages)

1. Create a Google Maps API key and enable Maps JavaScript API and Geocoding API.
2. Add a repository secret `GOOGLE_MAPS_API_KEY` in Settings → Secrets and Variables → Actions.
3. The GitHub Actions workflow will inject the API key during deployment.

### For Local Development

1. Obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Maps JavaScript API for your project.
3. **Option A: Direct replacement**
   - Open `index.html` and replace `YOUR_API_KEY` with your actual API key
4. **Option B: Environment variable**
   - Set the environment variable: `export GOOGLE_MAPS_API_KEY="your_actual_key"`
   - Run: `sed -i "s/YOUR_API_KEY/$GOOGLE_MAPS_API_KEY/g" index.html`
5. Run a static server from the project root (recommended — do not open files directly with file://)

```bash
# using npm http-server or serve
npx serve -l 8000
# or
npx http-server -c-1
```

- Open `http://localhost:8000/` and navigate to the site.

**⚠️ Important:** Never commit your API key to the repository. The placeholder `YOUR_API_KEY` in `index.html` is designed to be replaced during deployment.

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

## How to contribute

We welcome community contributions of new locations and fixes.

1. Use the `Add Location` page to generate JSON for a new resource.
2. Create a new GitHub issue using the "Add New Location" template and paste your JSON.
3. A maintainer will review, geocode if necessary, and add approved locations to `locations.json`.

Maintainers can also add locations directly to `locations.json` or use `pregeocode.js` to batch-geocode.

## Data format (locations.json)

Each location is an object with these keys:

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

Required fields: `name`, `address`, `county`, `type`.
Optional: `description`, `active` (default true), and `lat`/`lng` (recommended to pre-geocode).

## Usage

- Open the site and use the sidebar filters (county/type) or search to find resources.
- Click a marker or list item for details and directions.

## File structure

- `index.html` — Main map + list UI
- `add-location.html` — Community submission helper
- `styles.css` — Visual styles
- `script.js` — Map and UI logic
- `add-location.js` — Helper for processing submissions
- `pregeocode.js` — Batch geocoding helper
- `locations.json` — Data store for locations
- `.github/ISSUE_TEMPLATE/add-location.yml` — Issue template for submissions

## Testing & deploying

- Deploys via GitHub Actions to GitHub Pages. The workflow injects the API key from Actions secrets.
- For local testing, run a static server (see above).

## License

This project is open-source.
