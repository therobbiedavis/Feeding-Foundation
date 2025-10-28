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

- Open `index.html` in a web browser to view the map with food locations.
- Locations are loaded from `locations.json`. You can edit this file to add, remove, or modify locations.

## File Structure

- `index.html`: Main HTML page
- `styles.css`: CSS styles
- `script.js`: JavaScript for map initialization and location loading
- `locations.json`: JSON file containing location data

## Adding Locations

Edit `locations.json` to add new locations. Each location should have:
- `name`: Name of the location
- `address`: Full address (street, city, state, zip)
- `description`: Optional description

Example:
```json
{
    "name": "New Food Bank",
    "address": "123 Main St, Anytown, ST 12345",
    "description": "Serves the local community."
}
```

The site will automatically geocode the addresses to coordinates when loading.

## Hosting

This website is configured for automatic deployment to GitHub Pages. Once you set up the API key secret and enable Pages, pushes to the main branch will trigger deployment.

Alternatively, you can host it on other static site hosts like Netlify or Vercel by uploading the files directly.