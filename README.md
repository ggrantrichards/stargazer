# Stargazer

A celestial-event interface prototype with an animated star field, event cards, and browser geolocation support.

## Status

This is a UI experiment, not a verified astronomy calendar. The event data in [main.js](main.js) are embedded demo data, and visibility rules are simplified. Dates and viewing conditions need an authoritative astronomy source before using the app to plan an observation.

## Run locally

```bash
git clone https://github.com/ggrantrichards/stargazer.git
cd stargazer
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Structure

- `index.html`: page markup.
- `main.js`: star animation, event data, and location/event logic.
- `style.css`: visual styling.

Built with HTML, CSS, JavaScript, and Vite.
