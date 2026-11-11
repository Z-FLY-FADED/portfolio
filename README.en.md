# Pengfei Zhao · Engineering Portfolio

[简体中文](README.md) · **English**

[Visit the portfolio](https://z-fly-faded.github.io/portfolio/) · [Projects](https://z-fly-faded.github.io/portfolio/projects/) · [About and skills](https://z-fly-faded.github.io/portfolio/about/)

This repository hosts the public deployment of an engineering portfolio covering mechanical design, simulation, and software development. Project pages describe the engineering problem, the approach, and the available verification material, figures, or demos.

## Selected projects

- [DME autothermal reforming control simulation](https://z-fly-faded.github.io/portfolio/projects/dme-atr-simulink/)
- [Battery thermal management and BMS thermal model](https://z-fly-faded.github.io/portfolio/projects/bms-thermal-model/)
- [Piston ring station](https://z-fly-faded.github.io/portfolio/projects/piston-ring-station/)
- [Static finite element analysis of tooling](https://z-fly-faded.github.io/portfolio/projects/tooling-static-fea/)

## Deployment layout

| Path | Purpose |
| --- | --- |
| [`index.html`](index.html) | Portfolio home page |
| [`projects/`](projects/) · [`about/`](about/) | Project index, detail pages, biography, and skills |
| [`content.json`](content.json) | Structured content shipped with the site |
| [`assets/`](assets/) · [`files/`](files/) | Published images, demos, and downloads |

The site uses HTML, CSS, and JavaScript. GitHub Pages publishes from the root of `main`. Page assets use the `/portfolio/` path prefix. To preview locally, place this repository in a `portfolio/` subdirectory of your static server’s document root and open `/portfolio/`.
