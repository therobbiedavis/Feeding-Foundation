# Contributing to Feeding Foundation

Thank you for helping improve Feeding Foundation! We welcome contributions from community members and maintainers. This document explains the preferred workflow for submitting new locations, reporting bugs, and making code changes.

## Table of Contents

- How to submit a new location (recommended)
- Reporting bugs or feature requests
- Maintainer workflow (accepting locations)
- Code style & small changes
- Validating location JSON
- Running the project locally
- Geocoding & pre-processing

---

## How to submit a new location (recommended)

1. Go to the `Add Location` page (`add-location.html`).
2. Fill out the form and click **Generate Location Data**.
3. Copy the generated JSON from the page output.
4. Create a new GitHub issue using the **Add New Location** template (we provide a template). Paste the JSON into the issue body and add any notes or verification details.

Why this flow? It helps maintainers review submissions with a consistent format and minimizes mistakes.

## Reporting bugs or feature requests

- Use the repository Issues page to report bugs or request features. Choose the appropriate template if available.
- Provide steps to reproduce, browser/OS, and screenshots when helpful.

## Maintainer workflow (accepting locations)

1. Review the GitHub issue created by a contributor.
2. Validate the JSON and ensure required fields are present: `name`, `address`, `county`, `type`.
3. Optionally geocode the address (see Pregeocoding section) and add `lat`/`lng` to the location object.
4. Add the location to `locations.json` as a new entry.
5. Open a small PR with the updated `locations.json` and link the original issue. Use a short descriptive commit message like:

```
Add: Community-submitted location "Example Pantry" (Coweta)
```

6. After review and merge, close the issue and mention the change.

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

If you maintain a custom script for linting JSON, include it in the repo and mention it here.

## Running the project locally

We recommend running a small static server rather than opening files with `file://`.

```bash
npx serve -l 8000        # recommended
# or
npx http-server -c-1

# then open http://localhost:8000/
```

This will ensure fetch requests (e.g., for `locations.json`) work properly.

If you need to test Google Maps locally, set a temporary API key in your environment (do NOT commit it):

```bash
export GOOGLE_MAPS_API_KEY="YOUR_KEY"
# replace placeholder in index.html for local testing only
sed -i "s/YOUR_API_KEY/$GOOGLE_MAPS_API_KEY/g" index.html
```

## Geocoding & pre-processing

We prefer pre-geocoding addresses and storing `lat`/`lng` in `locations.json` to reduce runtime calls and avoid quota issues.

- Use `pregeocode.js` to batch-geocode addresses with Google Geocoding API or Nominatim for testing.
- Always keep API keys out of source control.

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
