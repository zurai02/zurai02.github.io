# zurai02.github.io

A personal portfolio and profile site for `zurai02`, hosted on GitHub Pages.

## Overview

This repository powers the main landing page for the portfolio, including:

- a custom dark portfolio layout
- social/profile redirect pages
- blog link loading and embedded fallback content
- lightweight static assets for a fast GitHub Pages deployment
- optional Node/Express-based local dev server support

## Project structure

- `index.html` — homepage and primary UI
- `style.min.css` — compiled site styles
- `desktop-hover.css` — hover/interaction styling
- `site.js` — page interactions and dynamic UI logic
- `server.ts` — local server entry used by the Node development scripts
- `redirect.js` / redirect pages — profile and external redirect handling
- `devforum/` and `discord/` — redirect pages for profile links

## Local development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

## Production deployment

This site is intended to be published as a GitHub Pages static site. The `deploy` script also minifies assets before publishing:

```bash
npm run deploy
```

## Notes

- The homepage intentionally uses direct stylesheet links to avoid GitHub Pages path issues.
- Static assets are served from the repository root for the Pages deployment.
- Some redirect pages are intentionally simple HTML landing pages that immediately send visitors to external destinations.
