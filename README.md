# Feeding Foundation

<div align="center">
  <img src="imgs/icon-min.png" alt="Feeding Foundation Logo" width="120">
  
  <p><strong>Connecting communities with food resources</strong></p>
  
  [![Live Site](https://img.shields.io/badge/Live-Demo-1f7f63?style=for-the-badge)](https://therobbiedavis.github.io/Feeding-Foundation/)
  [![Add Location](https://img.shields.io/badge/Add-Location-3bbf9a?style=for-the-badge)](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)
  [![Contribute](https://img.shields.io/badge/Contribute-GitHub-ef8a1f?style=for-the-badge)](https://github.com/therobbiedavis/Feeding-Foundation/issues/new/choose)
</div>

---

## 📖 Table of Contents

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

## 🎯 About

Feeding Foundation is a community-driven web application that maps local food resources — food banks, pantries, soup kitchens, community gardens, and farmers markets. Our mission is to help residents easily find nearby food assistance and support.

### Why Feeding Foundation?

- **Community-Curated**: Anyone can submit locations through our simple web form
- **Easy to Use**: Filter by county, location type, or search by name
- **Always Accessible**: Works on any device with graceful fallbacks
- **Open Source**: Built with transparency and community contribution in mind

## ✨ Features

- 🗺️ **Interactive Google Maps Integration** - Visual display of all food resource locations
- 🔍 **Advanced Filtering** - Filter by county, location type, or search by name/address
- 📱 **Mobile Responsive** - Fully optimized for smartphones, tablets, and desktop
- ⚡ **Fast Loading** - Pre-geocoded locations for instant map rendering
- 🤝 **Community Submissions** - Simple form for anyone to add new locations
- ♿ **Accessible Design** - Locations list available even when map is unavailable
- 🎨 **Modern UI** - Clean, professional design with smooth animations

## 🚀 Quick Start

### For Users

1. **Visit the live site**: [Feeding Foundation](https://therobbiedavis.github.io/Feeding-Foundation/)
2. **Browse locations** using the filters or search box
3. **Click any location** for details and directions

### For Contributors

1. **Go to** [Add Location page](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)
2. **Fill out the form** with location details
3. **Generate JSON** and copy the code
4. **Submit via** [GitHub issue](https://github.com/therobbiedavis/Feeding-Foundation/issues/new?labels=location-submission&template=add-location.yml)

## 🛠️ Local Development

### Prerequisites

- **Google Maps API Key** ([Get one here](https://console.cloud.google.com/))
  - Enable: Maps JavaScript API
  - Enable: Geocoding API
- **Node.js** (for helper scripts)
- **Static file server** (e.g., `serve`, `http-server`, or Python)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/therobbiedavis/Feeding-Foundation.git
   cd Feeding-Foundation
   ```

2. **Set up your API key**

   **Option A: Environment variable (recommended)**
   ```bash
   export GOOGLE_MAPS_API_KEY="your_actual_key"
   sed "s/YOUR_API_KEY/$GOOGLE_MAPS_API_KEY/g" index.html > index.temp.html
   mv index.temp.html index.html
   ```

   **Option B: Direct replacement (quick test)**
   ```bash
   # Manually edit index.html and replace YOUR_API_KEY
   # ⚠️ DO NOT commit this file with your key!
   ```

3. **Start a local server**
   ```bash
   # Using npx serve (recommended)
   npx serve -l 8000
   
   # Or using http-server
   npx http-server -p 8000 -c-1
   
   # Or using Python
   python3 -m http.server 8000
   ```

4. **Open in browser**
   ```
   http://localhost:8000
   ```

> **⚠️ Security Warning**: Never commit your API key to the repository! The `YOUR_API_KEY` placeholder is automatically replaced during deployment via GitHub Actions.

## 🌍 Pre-geocoding (Recommended)

Pre-geocoding stores latitude/longitude coordinates in `locations.json`, improving performance and reducing API quota usage.

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

> **Note**: Google is recommended for production. Nominatim is public and rate-limited—use only for testing small datasets.

## 🤝 Contributing

We welcome contributions from everyone! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Guide

#### For Community Members (No Coding Required)

1. Visit [Add Location page](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)
2. Fill out the form with location details
3. Click "Generate Location Data"
4. Copy the JSON code
5. [Create a GitHub issue](https://github.com/therobbiedavis/Feeding-Foundation/issues/new?labels=location-submission&template=add-location.yml)
6. Paste the JSON in the issue
7. Submit and wait for maintainer review

#### For Maintainers

**Adding Locations:**
```bash
# Use the helper script to validate and add
node add-location.js '{"name":"New Pantry","address":"123 Main St","county":"Coweta","type":"Food Bank"}'

# Pre-geocode the location
node pregeocode.js --write

# Commit changes
git add locations.json
git commit -m "Add: New Pantry (Coweta County)"
git push
```

**Code Contributions:**
- Keep changes focused and minimal
- Use semantic commit messages: `Add:`, `Fix:`, `Update:`, `Chore:`
- Follow existing code style
- Test locally before submitting PR

## 📊 Data Format

Each location in `locations.json` follows this structure:

```json
{
  "name": "Community Food Pantry",
  "address": "123 Main St, Newnan, GA 30263",
  "county": "Coweta",
  "type": "Food Bank",
  "description": "Open Tuesdays and Thursdays, 9am-5pm",
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

To temporarily disable a location without deletion:

```json
{
  "name": "Temporarily Closed Pantry",
  "active": false,
  ...
}
```

Inactive locations won't appear on the map but remain in the database.

## 📂 Project Structure

```
Feeding-Foundation/
├── index.html                      # Main map interface
├── add-location.html               # Community submission form
├── styles.css                      # Global styles (modern design)
├── script.js                       # Map and UI logic
├── locations.json                  # Location database
├── add-location.js                 # Helper: Add locations
├── pregeocode.js                   # Helper: Batch geocoding
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

## 🚀 Deployment

### GitHub Pages Setup

1. **Create Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
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
- ✅ Validates API key secret exists
- 🔒 Securely injects API key during build
- 📦 Builds and packages the site
- 🚀 Deploys to GitHub Pages
- 🔄 Runs on every push to `main` branch

### Alternative Hosting

The site is static and can be hosted anywhere:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect GitHub repository
- **Cloudflare Pages**: Deploy via Git integration
- **Any Web Server**: Upload all files to public directory

## 🐛 Troubleshooting

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
- ✅ Check API key is properly replaced in `index.html`
- ✅ Clear browser cache
- ✅ Check console for JavaScript errors

### Geocoding Failures

**Problem**: `pregeocode.js` fails to geocode

**Solutions**:
- ✅ Verify `GOOGLE_MAPS_API_KEY` environment variable is set
- ✅ Ensure Geocoding API is enabled
- ✅ Check address format (must include city, state, ZIP)
- ✅ Verify API quota hasn't been exceeded

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ for community impact
- Inspired by the need to connect people with food resources
- Thanks to all contributors and community members
- Powered by Google Maps Platform

## 📞 Support

- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/therobbiedavis/Feeding-Foundation/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/therobbiedavis/Feeding-Foundation/discussions)
- 📧 **Maintainer**: [@therobbiedavis](https://github.com/therobbiedavis)

---

<div align="center">
  <strong>Made with ❤️ for the community</strong>
  <br>
  <sub>Every location added helps someone find food and support</sub>
</div>