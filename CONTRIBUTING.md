# Contributing to Feeding Foundation

Thanks for considering contributing to Feeding Foundation! We appreciate your help in improving this project. This guide explains how to submit new locations, report bugs, and make code changes.

## Table of Contents

- How to submit a new location (recommended)
- Setting up your development environment
- Making code changes
- Testing your changes
- Submitting a pull request
- Reporting bugs or feature requests
- Maintainer workflow (accepting locations)
- Code style & small changes
- Validating location JSON
- Running the project locally
- Geocoding & pre-processing

---

## Quick Start for Contributors

**Want to add a location?** → [Go to Add Location page](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)

**Want to contribute code?**
1. Fork the repo
2. Clone locally: `git clone https://github.com/YOUR_USERNAME/Feeding-Foundation.git`
3. Install dependencies: `npm install`
4. Start developing: `npm run serve`
5. Create a pull request when ready

**Found a bug?** → [Create an issue](https://github.com/therobbiedavis/Feeding-Foundation/issues)

---

## How to submit a new location (recommended)

### Step-by-Step Location Submission

1. **Visit the Add Location page**:
   - Go to [add-location.html](https://therobbiedavis.github.io/Feeding-Foundation/add-location.html)
   - Or run locally: `http://localhost:8000/add-location.html`

2. **Fill out the location form**:
   - **Location Name** (required): Enter the official name of the food resource
   - **Location Type** (required): Select from the dropdown (Food Pantry, Soup Kitchen, etc.)
   - **Full Address** (required): Enter the complete street address
   - **Description**: Add details about what services are offered
   - **Schedule/Hours**: Include operating hours and days
   - **Website**: Add a URL if available

3. **Review auto-filled fields**:
   - The form will try to parse city, state, ZIP, and county from the address
   - Review and correct any automatically filled fields as needed
   - The form may geocode the address to get coordinates (requires API key)

4. **Generate the location data**:
   - Click the **"Submit Location"** button (enabled when required fields are filled)
   - This opens a pre-filled GitHub issue with the location data

5. **Submit the GitHub issue**:
   - Review the pre-filled information in the issue template
   - Add any additional context or verification details
   - Submit the issue for maintainer review

### What Happens Next

- **Maintainer Review**: A maintainer will review your submission within a few days
- **Validation**: They'll verify the location details and format
- **Optional Geocoding**: May add latitude/longitude coordinates for better map accuracy
- **Approval**: Once approved, your location will be added to the live map
- **Notification**: You'll be notified when your submission is processed

### Tips for Better Submissions

- **Accuracy**: Double-check addresses and contact information
- **Completeness**: Fill in as many optional fields as possible
- **Verification**: If possible, visit the location or call to confirm details
- **Updates**: If you notice a location has changed, you can submit an update using the same process

## Setting up your development environment

### Prerequisites

Before you start contributing, make sure you have these installed:

- **Git** (for version control)
- **Node.js** (version 18 or higher, for build tools)
- **A code editor** (VS Code, Sublime Text, etc.)
- **A web browser** (Chrome, Firefox, Safari, or Edge)

### Fork and Clone the Repository

1. **Fork the repository** on GitHub by clicking the "Fork" button in the top-right corner of [the main repository](https://github.com/therobbiedavis/Feeding-Foundation).

2. **Clone your fork** to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Feeding-Foundation.git
   cd Feeding-Foundation
   ```

3. **Set up the upstream remote** to stay in sync with the main repository:
   ```bash
   git remote add upstream https://github.com/therobbiedavis/Feeding-Foundation.git
   ```

4. **Install dependencies** for the build process:
   ```bash
   npm install
   ```

### Create a Development Branch

Always create a new branch for your changes:

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/issue-description
```

## Making code changes

### Understanding the Project Structure

```
Feeding-Foundation/
├── index.html                 # Main map page
├── add-location.html          # Location submission form
├── styles.css                 # Main stylesheet
├── script.js                  # Main JavaScript logic
├── locations.json             # Location database
├── add-location.js            # Helper script for adding locations
├── pregeocode.js             # Geocoding helper
└── imgs/                     # Images and icons
```

### Types of Changes You Can Make

1. **Add new locations** (see location submission section)
2. **Fix bugs** in the interface or functionality
3. **Improve styling** and user experience
4. **Add new features** (discuss first in an issue)
5. **Improve documentation**
6. **Optimize performance**

### Code Guidelines

- **HTML**: Use semantic HTML5 elements, keep accessibility in mind
- **CSS**: Follow existing naming conventions, use CSS custom properties for theming
- **JavaScript**: Use modern ES6+ features, keep code readable
- **JSON**: Keep location data well-formatted and consistent

## Testing your changes

### Local Testing Steps

1. **Start a local development server**:
   ```bash
   npm run serve
   # or
   npx serve -l 8000
   ```

2. **Open your browser** and navigate to `http://localhost:8000`

3. **Test your changes**:
   - Check that the map loads correctly
   - Test the add location form functionality
   - Verify mobile responsiveness
   - Test with different browsers if possible

4. **Test the build process**:
   ```bash
   npm run build
   ```
   This ensures your changes don't break the minification process.

### Manual Testing Checklist

- [ ] Map loads without errors
- [ ] Location filtering works
- [ ] Add location form validates input
- [ ] Geocoding functions properly (if API key is set)
- [ ] Mobile layout is responsive
- [ ] No console errors in browser dev tools
- [ ] All links and buttons work as expected

## Submitting a pull request

### Before Submitting

1. **Update your branch** with the latest changes from upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** to ensure everything works:
   ```bash
   npm run build
   npm run serve
   ```

3. **Commit your changes** with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   ```

   Use semantic commit prefixes:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements
   - `Chore:` for maintenance tasks

4. **Push your branch** to your fork:
   ```bash
   git push origin your-branch-name
   ```

### Creating the Pull Request

1. **Go to the main repository** on GitHub and click "Pull requests" > "New pull request"

2. **Select your fork and branch** as the source

3. **Write a clear PR description**:
   - What changes did you make?
   - Why did you make them?
   - How can reviewers test the changes?
   - Include screenshots if the changes affect the UI

4. **Link related issues** if applicable

5. **Request review** from maintainers if needed

### After Submitting

- **Respond to feedback** from reviewers promptly
- **Make requested changes** by pushing additional commits to your branch
- **Keep your branch updated** with upstream changes if the PR takes time

## Reporting bugs or feature requests

- Use the repository Issues page to report bugs or request features. Choose the appropriate template if available.
- Provide steps to reproduce, browser/OS, and screenshots when helpful.

## Maintainer workflow (accepting locations)

### Step-by-Step Location Approval Process

1. **Review the GitHub issue**:
   - Check that all required fields are present: `name`, `address`, `county`, `type`
   - Verify the information is accurate and complete
   - Look for any additional context provided by the contributor

2. **Validate the location data**:
   ```bash
   # Use the helper script to validate JSON format
   node add-location.js '{"name":"Example Pantry","address":"123 Main St","county":"Coweta","type":"Food Bank"}'
   ```

3. **Optional: Geocode the location**:
   ```bash
   # Set API key and geocode
   export GOOGLE_MAPS_API_KEY="your_key"
   node pregeocode.js --write
   ```

4. **Add to locations database**:
   - Open `locations.json` in your editor
   - Add the new location object to the JSON array
   - Maintain alphabetical or geographical ordering if preferred

5. **Create a pull request**:
   ```bash
   git checkout -b add/location-name-county
   git add locations.json
   git commit -m "Add: Community-submitted location 'Location Name' (County)"
   git push origin add/location-name-county
   ```

6. **Link and close the issue**:
   - Reference the original issue in your PR description
   - After merge, close the issue with a comment thanking the contributor

### Quality Checks for Maintainers

- [ ] Required fields present (`name`, `address`, `county`, `type`)
- [ ] Address format is complete and accurate
- [ ] Location type matches our supported categories
- [ ] No duplicate locations in the same area
- [ ] Information appears legitimate (not spam or test data)
- [ ] Optional: Coordinates added for map accuracy

## Code style & small changes

- Keep changes minimal and focused per PR. One purpose per PR is easier to review.
- Use semantic commit messages (Add:, Fix:, Update:, Chore:).
- For CSS/JS, keep the existing style and naming conventions. No heavy refactors without a discussion.

## Validating location JSON

Maintainers can use the included `add-location.js` helper to validate JSON from community submissions. Example:

```bash
# validate a single JSON object (stringified)
node add-location.js '{"name":"New Pantry","address":"123 Main St, Town, GA","county":"Coweta","type":"Food Bank","description":"Open Wed 10-2"}'
```

If you have a custom script for linting JSON, include it in the repo and mention it here.

## Running the project locally

We recommend running a small static server rather than opening files with `file://`.

```bash
npx serve -l 8000        # recommended
# or
npx http-server -c-1

# then open http://localhost:8000/
```

This ensures fetch requests (e.g., for `locations.json`) work properly.

If you need to test Google Maps locally, set a temporary API key in your environment (do NOT commit it):

```bash
export GOOGLE_MAPS_API_KEY="YOUR_KEY"
# replace placeholder in index.html for local testing only
sed -i "s/YOUR_API_KEY/$GOOGLE_MAPS_API_KEY/g" index.html
```

## Geocoding & pre-processing

We prefer pre-geocoding addresses and storing `lat`/`lng` in `locations.json` to reduce runtime calls and avoid quota issues.

### Running the Pre-geocoding Script

Use `pregeocode.js` to batch-geocode addresses before committing location changes:

```bash
# Option 1: Using Google Geocoding API (recommended for production)
# Set your Google Maps API key as an environment variable
export GOOGLE_MAPS_API_KEY="your_api_key_here"
node pregeocode.js --write

# Option 2: Using OpenStreetMap Nominatim (free, rate-limited)
# Good for testing, but check Nominatim usage policies
node pregeocode.js --use-nominatim --write
```

**What it does:**
- Reads `locations.json` and identifies locations without `lat`/`lng` coordinates
- Geocodes missing addresses using Google Maps API or Nominatim
- Writes results to `locations.pregeo.json` first for review
- With `--write` flag, overwrites `locations.json` with geocoded coordinates

**Notes:**
- Google Maps API requires an API key (keep it secret, never commit to repo)
- Nominatim is free but has strict rate limits (1 request/second) and usage policies
- Always review `locations.pregeo.json` before using `--write`
- Geocoding failures are logged but don't stop the process

## Troubleshooting common issues

### Build or development setup problems

**Problem**: `npm install` fails
```
Solution: Make sure you have Node.js 18+ installed. Try clearing npm cache: npm cache clean --force
```

**Problem**: Local server won't start
```
Solution: Check if port 8000 is already in use. Try a different port: npx serve -l 8080
```

**Problem**: Map doesn't load locally
```
Solution: Make sure you're using a local server (not file://). Check browser console for errors.
```

### Location submission issues

**Problem**: Form won't generate location data
```
Solution: Make sure all required fields (Name, Address, Type) are filled out completely.
```

**Problem**: Geocoding fails in the form
```
Solution: This is normal without an API key. The location will still be submitted for review.
```

**Problem**: GitHub issue doesn't open
```
Solution: Check that your browser allows popups from the site. Try disabling popup blockers temporarily.
```

### Code contribution issues

**Problem**: Build fails with minification errors
```
Solution: Check for syntax errors in your JavaScript or CSS. Run npm run build to test locally.
```

**Problem**: Changes don't appear after refresh
```
Solution: Hard refresh your browser (Ctrl+F5) or clear browser cache.
```

**Problem**: Git conflicts when updating branch
```
Solution: Run git fetch upstream && git rebase upstream/main to resolve conflicts.
```

## Licensing & Code of Conduct

By contributing, you agree your contributions are licensed under the project's [MIT License](LICENSE).

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming environment for all contributors. Please read and follow these guidelines when participating in our community.

### Contact

For questions about contributions or to report violations of the Code of Conduct, please [create an issue](https://github.com/therobbiedavis/Feeding-Foundation/issues) or contact the maintainers.

---

## Additional Resources

- [GitHub Community Guidelines](https://docs.github.com/en/github/site-policy/github-community-guidelines)
- [Open Source Guides](https://opensource.guide/)

Thanks for contributing — every location helps people find food and support in their community.
