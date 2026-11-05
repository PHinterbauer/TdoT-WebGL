# TdoT-WebGL — Armored Core 6: Raven WebGL Renderer

A clean, single-file, offline WebGL 3D renderer of Raven from Armored Core VI: Fires of Rubicon, built with HTML5, WebGL, Three.js, and vanilla JavaScript.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-Ready-4CAF50?style=for-the-badge)](./index.html)

---

## Description

TdoT-WebGL is a self-contained, offline-capable WebGL 3D renderer that brings an Armored Core-style mech to the browser in a single HTML file. Three.js (r128) is fully inlined, so there are no external dependencies, no build step, and no internet required — just open index.html in any modern browser.

The scene presents NIGHTFALL from Armored Core VI: Fires of Rubicon inside a detailed industrial maintenance hangar. The AC is suspended from a workshop gantry by a four-point sling, with a travelling overhead crane, corrugated walls, roof trusses, concrete floor, service benches, task lighting, and drifting dust. Nine inspection systems can be selected from numbered 3D hotspots or the component index to open a technical dossier with frame, weapon, and in-game context. A subtle, optional suspension sway replaces the former dash animation.

The real Raven model is loaded from raven.glb (GLTF/GLB). Set CONFIG.modelPath = null in the inline configuration in index.html to use the procedurally generated placeholder. See Model Format below.

---

## Features

| Feature | Description |
|---------|-------------|
| Hangar Inspection Scene | NIGHTFALL is suspended from a four-point sling beneath an industrial workshop gantry. |
| Component Inspection | Nine clickable 3D hotspots and a component index open technical records and Armored Core VI game intel. |
| Collapsible Sidebar | UI panel collapses/expands for unobstructed fullscreen viewing. |
| Fullscreen Mode | Toggle fullscreen via button; UI chrome hides automatically. |
| Suspension Motion | A subtle low-frequency sway can be held or resumed from the inspection panel. |
| Orbit Controls | Left-drag rotate, middle-mouse drag pan with limits, scroll-wheel zoom; touch-drag supported. |
| Workshop Environment | Concrete floor, industrial walls, roof trusses, gantry crane, service benches, warm task lights, and floating dust. |
| Single-File / Offline | index.html embeds Three.js (r128), its matching GLTFLoader, and all application code. The adjacent raven.glb can be selected locally when opened via file://. |
| Watermark | Semi-transparent credit in the corner: Paul Hinterbauer 5BHWII @ TGM HWI. |

---

## Quick Start

1. Clone or download this repository, keeping index.html and raven.glb in the same folder.
2. Double-click index.html to open it in a modern browser (Chrome, Firefox, Edge, Safari).
3. When the page opens directly from your computer, click "Choose raven.glb" and select the raven.glb file from that folder. This one-time selection is required by browser security.
4. Interact:
   - Select a numbered marker on NIGHTFALL or a system in the component index to inspect it.
   - Read the selected component's technical record and game intel in the dossier panel.
   - Toggle the subtle suspension sway or hold the mech stationary.
   - Collapse the panel or press fullscreen for an unobstructed inspection view.
   - Orbit the camera: left-drag to rotate, hold the middle mouse button to pan, and use the wheel to zoom.

No build step, package manager, local server, or internet connection is required. When opened via file://, the browser does not let the page read raven.glb by pathname, so the user selects the file once through the built-in file picker. The app then reads the selected file locally with FileReader and parses it with the embedded GLTFLoader. When hosted on HTTP(S), raven.glb loads automatically from the same folder.

---

## Controls

| Input | Action |
|-------|--------|
| Component Hotspots | Click one of the numbered markers on the AC to inspect a system. |
| Component Index | Select a system from the sidebar to open its inspection dossier. |
| Collapse / Expand | Sidebar toggle — hide/show the UI panel. |
| Fullscreen | Floating top-right button or sidebar button. |
| Rotate Camera | Left mouse drag (or one-finger touch drag). |
| Pan Camera | Hold the middle mouse button and drag. Panning is limited to keep Raven in view. |
| Zoom | Mouse wheel / pinch. |
| Load Model | Click Load Raven Model and select a local .glb file. |
| Suspension Motion | Toggle the subtle hanging sway or hold the AC in place. |
| Recenter View | Restore the initial camera position and framing. |

---

## Model Format (to load the real Raven)

To replace the placeholder mech with the actual Raven from Armored Core VI: Fires of Rubicon:

1. Obtain a GLTF / GLB model (.glb recommended — single binary containing geometry, materials, and animations).
2. Save it as raven.glb next to index.html.
3. In the inline CONFIG object near the top of index.html, change:

   ```js
   const CONFIG = {
     modelPath: null,
     ...
   };
   ```

   to:

   ```js
   const CONFIG = {
     modelPath: './raven.glb',
     ...
   };
   ```

4. The matching Three.js r128 GLTFLoader is embedded directly in index.html. When opened via file://, use the built-in file picker to select raven.glb; when hosted on HTTP(S), the file loads automatically. The app falls back to the placeholder if loading fails.

### Recommended model source

A reputable, free source is Sketchfab (owned by Epic Games), which hosts fan-made AC6 models:

- NIGHTFALL V1 — Raven from AC6: https://sketchfab.com/3d-models/nightfall-v1-a54c8e04143d41cd98d910ce5474b0fa
- Gill_Almighty's AC6 collection: https://sketchfab.com/Gill_Almighty/collections/armored-core-6-137521e476d645af9bc96ea9ea014d7e

Download in GLB format and place it in this folder.

---

## Tech Stack

- HTML5 — Markup & canvas
- WebGL (via Three.js r128) — 3D rendering
- Three.js — Scene graph, lights, materials, GLTF loader
- Vanilla JavaScript — Animation loop, UI, camera controls
- CSS3 — Sidebar, buttons, fullscreen styles

---

## Project Structure

```
TdoT-WebGL/
├── index.html          Single self-contained HTML file (Three.js + GLTFLoader + app code)
├── raven.glb            Raven 3D model
├── README.md            Project documentation
├── PROJECT_INFO.txt     Project notes and model instructions
└── LICENSE              MIT License
```

---

## Time-of-Day Lighting

The directional sunlight is driven by a 0-24h slider. Fixed studio lights and a procedural reflection cube-map remain active independently of the selected hour. Internally, updateTimeOfDay(hour) adjusts:

- Sun position on an arc across the sky
- Sun color and intensity (dim at night, bright at noon, warm at dawn/dusk)
- Hemisphere light and ambient fill
- Atmospheric sky gradient and fog color

This lets you quickly test how the mech looks under different lighting scenarios without reloading.

---

## Credits and Attribution

- Three.js (r128) and GLTFLoader (r128): Copyright 2010-2021 Three.js Authors. MIT License.
- Placeholder mech: Procedurally generated with Three.js primitives.
- Watermark: Paul Hinterbauer 5BHWII @ TGM HWI
- Model inspiration: Raven from Armored Core VI: Fires of Rubicon (FromSoftware / Bandai Namco).

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repo.
2. Create a feature branch (git checkout -b feature/your-feature).
3. Commit your changes (git commit -m "Add: your feature").
4. Push to the branch (git push origin feature/your-feature).
5. Open a Pull Request.

Please keep changes consistent with the single-file, offline-first design philosophy.

---

## License

This project is licensed under the MIT License — see LICENSE for details.

Three.js is separately licensed under the MIT License (Three.js Authors).

---

## Repository

GitHub: https://github.com/PHinterbauer/TdoT-WebGL

---

## Author

Paul Hinterbauer — 5BHWII @ TGM HWI

Watermark included in-render: Paul Hinterbauer 5BHWII @ TGM HWI

---

Built for offline, single-file WebGL rendering. No build step or external JavaScript files. Serve the folder locally and open index.html.
