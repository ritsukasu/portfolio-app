<h1 align="center">My Portfolio</h1>

<p align="center">
  Add, edit and organize your work by category.
</p>

<p align="center">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&logoColor=black">
  <img alt="Dexie.js" src="https://img.shields.io/badge/DB-Dexie.js-4b8bbe">
  <img alt="Status: work in progress" src="https://img.shields.io/badge/status-work%20in%20progress-orange">
</p>

<p align="center">
  <img alt="The portfolio manager showing the project form, category form and a list of projects with pictures" src="portfolio-preview-full.png" width="100%">
</p>

> **Note:** this is only the start of my portfolio for this subject. More projects and pages will be added as the course goes on.

A small portfolio manager that runs in the browser. Add projects with a title, year, tags, link and thumbnail, group them by category, then search and filter them. Everything is saved locally with IndexedDB, so no server is needed.

## Quick start

```bash
git clone https://github.com/ritsukasu/portfolio-app.git
cd portfolio-app
```

Then open `index.html` in your browser.

## Project structure

```text
.
├── index.html            # Page layout
├── portfolio-preview-full.png  # Preview used in this README
├── style.css             # Design and animations
├── app.js                # Projects, categories and Dexie database
├── motion.js             # Animated node background
└── portfolio.mongodb.js  # MongoDB version of the data
```

## Built with

- [HTML, CSS and JavaScript](https://developer.mozilla.org) for the interface
- [Dexie.js](https://dexie.org) for IndexedDB storage
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) and [DM Mono](https://fonts.google.com/specimen/DM+Mono) for type

## Credits

Made by **Ryan Valencia** for coursework. Design inspired by [fragment.im](https://www.fragment.im/).
