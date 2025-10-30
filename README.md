# Feeding Foundation

<div align="center">
  <img src="imgs/icon-min.png" alt="Feeding Foundation Logo" width="120">
  
  <p><strong>Connecting communities with food resources</strong></p>
  
  [![Live Site](https://img.shields.io/badge/Live-Demo-1f7f63?style=for-the-badge)](https://therobbiedavis.github.io/Feeding-Foundation/)
  [![Add Location](https://img.shields.io/badge/Add-Location-3bbf9a?style=for-the-badge)](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)
  [![Contribute](https://img.shields.io/badge/Contribute-GitHub-ef8a1f?style=for-the-badge)](https://github.com/therobbiedavis/Feeding-Foundation/issues/new/choose)
</div>

---

## Table of Contents

- [About](#-about)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Local Development](#-local-development)
- [Pre-geocoding](#-pre-geocoding-recommended)
- [Contributing](#-contributing)
- [Data Format](#-data-format)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## About

Feeding Foundation is a web app built by the community to help people find local food resources like food banks, pantries, soup kitchens, community gardens, and farmers markets. Our goal is to make it easy for folks to discover nearby food assistance and support.

### Why Feeding Foundation?

- **Community-Curated**: Anyone can add locations through our simple web form
- **Easy to Use**: Filter by county, location type, or search by name
- **Always Accessible**: Works on any device with helpful fallbacks
- **Open Source**: Built transparently with community contributions in mind

## Features

- **Interactive Google Maps Integration** - See all food resource locations on a visual map
- **Advanced Filtering** - Narrow down by county, location type, or search by name/address
- **Mobile Responsive** - Looks great and works smoothly on phones, tablets, and desktops
- **Fast Loading** - Pre-geocoded locations so the map pops up instantly
- **Community Submissions** - Easy form for anyone to add new locations
- **Accessible Design** - Locations list available even if the map won't load

## Quick Start

### For Users

1. **Visit the live site**: [Feeding Foundation](https://therobbiedavis.github.io/Feeding-Foundation/)
2. **Browse locations** using the filters or search box
3. **Click any location** for details and directions

### For Contributors

1. **Go to** [Add Location page](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)
2. **Fill out the form** with location details
3. **Click "Submit Location"** to open a pre-filled GitHub issue
4. **Review and submit** the issue for maintainer approval

## Local Development

### Prerequisites

- **Google Maps API Key** ([Get one here](https://console.cloud.google.com/))
  - Enable: Maps JavaScript API
  - Enable: Geocoding API
- **Node.js** (version 18 or higher, for build tools and helper scripts)
- **Static file server** (e.g., `serve`, `http-server`, or Python)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/therobbiedavis/Feeding-Foundation.git
   cd Feeding-Foundation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your API key** (for local testing with geocoding)

   **Option A: Environment variable (recommended)**
   ```bash
   export GOOGLE_MAPS_API_KEY="your_actual_key"
   ```

   **Option B: Direct replacement (quick test)**
   ```bash
   # Manually edit index.html and add-location.html to replace YOUR_API_KEY
   # ⚠️ DO NOT commit these files with your key!
   ```

4. **Start a local server**
   ```bash
   # Using npx serve (recommended)
   npm run serve
   
   # Or using http-server
   npx http-server -p 8000 -c-1
   
   # Or using Python
   python3 -m http.server 8000
   ```

5. **Open in browser**
   ```
   http://localhost:8000
   ```

### Build Process

The project includes automated minification for production deployment:

```bash
# Install dependencies (one-time setup)
npm install

# Build minified assets for production
npm run build

# Start development server
npm run serve
```

The build process minifies CSS and JavaScript files, reducing total size by ~43% for faster loading.

> **⚠️ Security Warning**: Never commit your API key to the repository! The `YOUR_API_KEY` placeholder is automatically replaced during deployment via GitHub Actions.

## 🌍 Pre-geocoding (Recommended)

Pre-geocoding stores latitude/longitude coordinates in `locations.json`, which speeds things up and cuts down on API usage.

### Using Google Geocoding API (Recommended)

```bash
# Set your API key
export GOOGLE_MAPS_API_KEY="your_key_here"

# Run geocoding and overwrite locations.json
node pregeocode.js --write
```

### Using OpenStreetMap Nominatim (Testing Only)

```bash
# For small datasets - rate limited to 1 req/sec
node pregeocode.js --use-nominatim --write
```

### Preview Without Overwriting

```bash
# Generate locations.pregeo.json without modifying locations.json
node pregeocode.js
```

> **Note**: Google is recommended for production. Nominatim is free but has strict rate limits and usage policies—use only for testing small datasets.

## Contributing

We'd love your help to make Feeding Foundation even better! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

### Ways to Contribute

- **Add Locations**: Use our [Add Location form](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html) (no coding required)
- **Report Issues**: [Create an issue](https://github.com/therobbiedavis/Feeding-Foundation/issues) for bugs or feature requests
- **Code Contributions**: Fork the repo, make changes, and submit a pull request
- **Documentation**: Help improve guides and documentation

For detailed instructions on any contribution type, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Data Format

Each location in `locations.json` follows this structure:

```json
{
  "name": "Community Food Pantry",
  "address": "123 Main St, Newnan, GA 30263",
  "county": "Coweta",
  "type": "Food Bank",
  "description": "Open Tuesdays and Thursdays, 9am-5pm",
  "schedule": "Tuesdays and Thursdays 9:30am-12pm",
  "active": true,
  "lat": 33.3854297,
  "lng": -84.8276268
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Location name |
| `address` | String | Full address (street, city, state, ZIP) |
| `county` | String | County name |
| `type` | String | Location type (see below) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | String | "Take what you need..." | Brief description |
| `schedule` | String | `null` | Hours/days of operation (e.g., "Tuesdays and Thursdays 9:30am-12pm") |
| `active` | Boolean | `true` | Whether location is operational |
| `lat` | Number | `null` | Latitude (recommended to pre-geocode) |
| `lng` | Number | `null` | Longitude (recommended to pre-geocode) |

### Location Types

- `Little Free Pantry` - 24/7 accessible food boxes
- `Food Bank` - Organizations distributing food
- `Soup Kitchen` - Places serving prepared meals
- `Community Garden` - Shared gardens with available food
- `Farmers Market` - Markets selling fresh produce
- `Other` - Any other food resource

### Managing Inactive Locations

To temporarily disable a location without deleting it:

```json
{
  "name": "Temporarily Closed Pantry",
  "active": false,
  ...
}
```

Inactive locations won't show up on the map but stay in the database.

## Project Structure

```
Feeding-Foundation/
├── index.html                      # Main map interface
├── add-location.html               # Community submission form
├── styles.css                      # Global styles (modern design)
├── styles.min.css                  # Minified CSS (generated during build)
├── script.js                       # Map and UI logic
├── script.min.js                   # Minified JS (generated during build)
├── add-location-inline.css         # Inline styles from add-location.html
├── add-location-inline.min.css     # Minified inline CSS (generated during build)
├── add-location-inline.js          # Inline JS from add-location.html
├── add-location-inline.min.js      # Minified inline JS (generated during build)
├── locations.json                  # Location database
├── add-location.js                 # Helper: Add locations
├── pregeocode.js                   # Helper: Batch geocoding
├── package.json                    # Build dependencies and scripts
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── add-location.yml        # Location submission template
│   │   └── config.yml              # Issue template config
│   └── workflows/
│       └── deploy.yml              # GitHub Actions deployment
├── imgs/                           # Images and icons
├── CONTRIBUTING.md                 # Contribution guidelines
└── README.md                       # This file
```

## Deployment

### GitHub Pages Setup

1. **Create Google Maps API Key**
   - Head to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable **Maps JavaScript API** and **Geocoding API**
   - Create API key and restrict to your domain

2. **Add GitHub Secret**
   - Repository Settings → Secrets and Variables → Actions
   - New secret: `GOOGLE_MAPS_API_KEY`
   - Value: Your actual API key

3. **Enable GitHub Pages**
   - Repository Settings → Pages
   - Source: **GitHub Actions**
   - Push to `main` branch triggers automatic deployment

### Deployment Workflow

The `.github/workflows/deploy.yml` automatically:
- Validates API key secret exists
- Securely injects API key during build
- Minifies CSS and JavaScript (including inline assets)
- Builds and packages the site
- Deploys to GitHub Pages
- Runs on every push to `main` branch

### Alternative Hosting

The site is static and can be hosted anywhere:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect GitHub repository
- **Cloudflare Pages**: Deploy via Git integration
- **Any Web Server**: Upload all files to public directory

## Troubleshooting

### Map Not Loading

**Problem**: Blank map or "Map Unavailable" message

**Solutions**:
- ✅ Verify API key is set correctly in GitHub Secrets
- ✅ Check browser console for errors (F12)
- ✅ Ensure Maps JavaScript API and Geocoding API are enabled
- ✅ Verify API key restrictions match your domain
- ✅ Check if API quota is exceeded

### Locations Not Appearing

**Problem**: Locations missing from map/list

**Solutions**:
- ✅ Verify `locations.json` is valid JSON
- ✅ Ensure locations have `"active": true` or omit the field
- ✅ Check that coordinates are pre-geocoded or addresses are valid
- ✅ Clear browser cache (Ctrl+Shift+R)

### Local Development Issues

**Problem**: Site not working locally

**Solutions**:
- ✅ Use a local server (not `file://` URLs)
- ✅ Check API key is properly replaced in `index.html` and `add-location.html`
- ✅ Run `npm run build` if assets aren't loading
- ✅ Clear browser cache
- ✅ Check console for JavaScript errors

### Geocoding Failures

**Problem**: `pregeocode.js` fails to geocode

**Solutions**:
- ✅ Verify `GOOGLE_MAPS_API_KEY` environment variable is set
- ✅ Ensure Geocoding API is enabled
- ✅ Check address format (must include city, state, ZIP)
- ✅ Verify API quota hasn't been exceeded

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Inspired by the need to connect people with food resources
- Thanks to all contributors and community members
- Powered by Google Maps Platform

## Support

- **Report Bugs**: [GitHub Issues](https://github.com/therobbiedavis/Feeding-Foundation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/therobbiedavis/Feeding-Foundation/discussions)
- **Maintainer**: [@therobbiedavis](https://github.com/therobbiedavis)

---

<div align="center">
  <strong>Made with ❤️ for the community</strong>
  <br>
  <sub>Every location added helps someone find food and support</sub>
</div>