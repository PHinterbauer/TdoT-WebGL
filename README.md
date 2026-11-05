# TdoT-WebGL — Armored Core 6: Raven WebGL Renderer

> A clean, single-file, offline WebGL 3D renderer of an **Armored Core** (placeholder for *Raven* from *Armored Core VI: Fires of Rubicon*), built with HTML5, WebGL, Three.js, and vanilla JavaScript.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline-Ready-4CAF50?style=for-the-badge)](./index.html)

---

## 📖 Description

**TdoT-WebGL** is a self-contained, offline-capable WebGL 3D renderer that brings an Armored Core–style mech to the browser in a single HTML file. Three.js (r128) is fully inlined, so there are **no external dependencies, no build step, and no internet required** — just open `index.html` in any modern browser.

The scene features a placeholder Armored Core mech (dark armor with Raven-red accents) performing a dash animation: it leans forward slightly while its back thrusters flare with animated flames. A minimalistic backdrop (gradient sky sphere + dark ground + subtle grid) keeps the focus on the model, while an adjustable sunlight slider lets you test different time-of-day lighting scenarios.

> ⚠️ **Placeholder model:** The current render uses a procedurally generated placeholder mech. To load the real Raven model, drop a `raven.glb` (GLTF/GLB) file into this folder and set `CONFIG.modelPath = './raven.glb'` in `app.js`. See [Model Format](#-model-format) below.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎮 **Dash Animation** | Mech leans forward and back thrusters shoot animated flame pulses. |
| ▶️⏸️🔄 **Playback Controls** | Play / Pause / Restart buttons for the animation cycle. |
| 📑 **Collapsible Sideboard** | UI panel collapses/expands for unobstructed fullscreen viewing. |
| 🖥️ **Fullscreen Mode** | Toggle fullscreen via button; UI chrome hides automatically. |
| ☀️ **Adjustable Sunlight** | Time-of-Day slider (0–24h) shifts sun color, position, intensity, sky gradient, ground color, and fog (night → dawn → day → dusk → night). |
| 🎥 **Orbit Controls** | Left-drag rotate, right-drag pan, scroll-wheel zoom; touch-drag supported. |
| 🎨 **Minimalistic Backdrop** | Gradient sky sphere, dark ground plane, subtle grid — never distracts from the mech. |
| 💾 **Single-File / Offline** | `index.html` inlines Three.js (r128) and all app code. Runs entirely offline. |
| 🏷️ **Watermark** | Semi-transparent credit in the corner: `Paul Hinterbauer  5BHWII  @  TGM HWI`. |

---

## 🚀 Quick Start

1. **Clone or download** this repository.
2. **Open** `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. **Interact:**
   - Use the sideboard to play/pause/restart the dash animation.
   - Drag the Time-of-Day slider to change lighting.
   - Collapse the sidebar or press the fullscreen button for an immersive view.
   - Orbit the camera: **left-drag** rotate • **right-drag** pan • **scroll** zoom.

> No server, no `npm install`, no internet connection required.

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Play / Pause / Restart** | Sideboard buttons — control the dash animation. |
| **Time of Day** | Sideboard slider — adjust sunlight/lighting (0–24h). |
| **Collapse / Expand** | Sideboard toggle — hide/show the UI panel. |
| **Fullscreen** | Floating top-right button or sideboard button. |
| **Rotate Camera** | Left mouse drag (or one-finger touch drag). |
| **Pan Camera** | Right mouse drag. |
| **Zoom** | Mouse wheel / pinch. |

---

## 📦 Model Format (to load the real Raven)

To replace the placeholder mech with the actual **Raven** from *Armored Core VI: Fires of Rubicon*:

1. Obtain a **GLTF / GLB** model (`.glb` recommended — single binary containing geometry, materials, and animations).
2. Save it as `raven.glb` next to `index.html`.
3. In `app.js`, change:

   ```js
   const CONFIG = {
     modelPath: null,   // <-- set this to './raven.glb'
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

4. The app uses `THREE.GLTFLoader` and falls back gracefully to the placeholder if the model fails to load.

### 🔗 Recommended model source
A reputable, free source is **Sketchfab** (owned by Epic Games), which hosts fan-made AC6 models:

- **NIGHTFALL V1 — Raven from AC6:** https://sketchfab.com/3d-models/nightfall-v1-a54c8e04143d41cd98d910ce5474b0fa
- **Gill_Almighty's AC6 collection:** https://sketchfab.com/Gill_Almighty/collections/armored-core-6-137521e476d645af9bc96ea9ea014d7e

Download in GLB format and place it in this folder.

---

## 🛠️ Tech Stack

- **HTML5** — Markup & canvas
- **WebGL** (via Three.js r128) — 3D rendering
- **Three.js** — Scene graph, lights, materials, GLTF loader
- **Vanilla JavaScript** — Animation loop, UI, camera controls
- **CSS3** — Sidebar, buttons, fullscreen styles

---

## 🗂️ Project Structure

```
TdoT-WebGL/
├── index.html          # Single self-contained HTML file (Three.js + app inlined)
├── three.min.js        # Three.js r128 UMD library (reference copy; inlined in index.html)
├── app.js              # Application source (inlined in index.html)
├── PROJECT_INFO.txt    # Persistent project notes & model format instructions
├── README.md           # This file
└── LICENSE             # MIT License
```

---

## 🌗 Time-of-Day Lighting

The directional "sun" light is driven by a 0–24h slider. Internally, `updateTimeOfDay(hour)` computes:

- **Sun position** on an arc across the sky
- **Sun color & intensity** (dim at night, bright at noon, warm at dawn/dusk)
- **Hemisphere light** (sky zenith / ground color)
- **Ambient fill**
- **Sky gradient** and **fog color** to match

This lets you quickly test how the mech looks under different lighting scenarios without reloading.

---

## 🙋‍♂️ Credits & Attribution

- **Three.js (r128):** Copyright 2010–2021 Three.js Authors. [MIT License](https://github.com/mrdoob/three.js/blob/master/LICENSE).
- **Placeholder mech:** Procedurally generated with Three.js primitives.
- **Watermark:** `Paul Hinterbauer  5BHWII  @  TGM HWI`
- **Model inspiration:** *Raven* from *Armored Core VI: Fires of Rubicon* (FromSoftware / Bandai Namco).

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add: your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please keep changes consistent with the single-file, offline-first design philosophy.

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

Three.js is separately licensed under the MIT License (Three.js Authors).

---

## 🔗 Repository

**GitHub:** https://github.com/PHinterbauer/TdoT-WebGL

---

## 🧑‍💻 Author

**Paul Hinterbauer** — 5BHWII @ TGM HWI  
Watermark included in-render: `Paul Hinterbauer  5BHWII  @  TGM HWI`

---

*Built for offline, single-file WebGL rendering. No build step. No dependencies. Just open and run.*
