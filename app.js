// ============================================================================
// Armored Core 6: Fires of Rubicon — "Raven" Placeholder WebGL Renderer
// Single-file offline renderer built with HTML5 + WebGL + Three.js (UMD build)
// ============================================================================
// NOTE: Three.js (r128 UMD) is inlined in index.html and exposes a global `THREE`.
// When you provide the Raven model, save it as `raven.glb` (or .gltf) next to
// this file and set CONFIG.modelPath = './raven.glb' below.
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------
  const CONFIG = {
    // Path to the real Raven model (GLTF/GLB). Set to './raven.glb' to load it.
    // Required format: GLTF / GLB (.glb recommended — single binary file).
    modelPath: './raven.glb',

    // Placeholder mech colors
    mechColor: 0x1a1a1a,      // dark armor
    accentColor: 0xff1a1a,    // raven red accent
    glowColor: 0xff4d4d,
    flameColor: 0xff3300,

    // Animation
    dashDuration: 1.6,        // seconds for one dash cycle
    leanAngle: 0.25,          // radians forward lean during dash
    flamePulseSpeed: 12,
  };

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const state = {
    isPlaying: true,
    time: 0,                  // animation time (seconds)
    speed: 1.0,
    timeOfDay: 12,            // 0 - 24 hours
    showSidebar: true,
    fullscreen: false,
    mouse: new THREE.Vector2(),
    isDragging: false,
    lastMouse: new THREE.Vector2(),
  };

  // --------------------------------------------------------------------------
  // Three.js internals
  // --------------------------------------------------------------------------
  let scene, camera, renderer;
  let mechGroup, bodyMesh, headMesh, thrusterGroup;
  let flameMeshes = [];       // thruster flame cones
  let sunLight, hemiLight, ambientLight;
  let skySphere;
  let ground;
  let clock = new THREE.Clock();

  // Camera orbit state (simple custom controls)
  const orbit = {
    theta: Math.PI * 0.25,    // azimuth
    phi: Math.PI * 0.35,      // polar
    radius: 14,
    target: new THREE.Vector3(0, 1, 0),
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080810, 0.018);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 3, 12);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lights
    createLights();

    // Backdrop (minimalistic sky + ground)
    createBackdrop();

    // Model / placeholder
    if (CONFIG.modelPath) {
      loadModel(CONFIG.modelPath);
    } else {
      createPlaceholderMech();
    }

    // UI wiring
    wireUI();

    // Resize
    window.addEventListener('resize', onWindowResize, false);

    // Watermark (slightly transparent, corner)
    createWatermark();

    // Start loop
    animate();
  }

  function createWatermark() {
    const wm = document.createElement('div');
    wm.id = 'watermark';
    wm.textContent = 'Paul Hinterbauer  5BHWII  @  TGM HWI';
    wm.style.position = 'fixed';
    wm.style.bottom = '18px';
    wm.style.right = '18px';
    wm.style.zIndex = '10000';
    wm.style.fontFamily = 'Consolas, Menlo, Monaco, monospace';
    wm.style.fontSize = '12px';
    wm.style.color = 'rgba(255, 255, 255, 0.45)';
    wm.style.pointerEvents = 'none';
    wm.style.letterSpacing = '1px';
    wm.style.textShadow = '0 0 6px rgba(0,0,0,0.6)';
    wm.style.userSelect = 'none';
    document.body.appendChild(wm);
  }

  // --------------------------------------------------------------------------
  // Lights
  // --------------------------------------------------------------------------
  function createLights() {
    // Ambient (soft fill)
    ambientLight = new THREE.AmbientLight(0x404055, 0.5);
    scene.add(ambientLight);

    // Hemisphere for ground/sky fill
    hemiLight = new THREE.HemisphereLight(0x88aadd, 0x222233, 0.6);
    scene.add(hemiLight);

    // Sunlight (directional) — adjusted by time-of-day slider
    sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    updateTimeOfDay(state.timeOfDay);
  }

  function updateTimeOfDay(hour) {
    // Clamp
    hour = ((hour % 24) + 24) % 24;

    // Sun position on an arc across the sky (XZ plane), elevated
    const t = hour / 24;                       // 0..1
    const angle = (t - 0.25) * Math.PI * 2;    // sunrise at t=0.25 roughly east
    const radius = 40;
    const sunX = Math.cos(angle) * radius;
    const sunZ = Math.sin(angle) * radius;
    const sunY = Math.max(0, Math.sin((t - 0.25) * Math.PI)) * 25; // up during day

    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.target.position.set(0, 0, 0);
    sunLight.target.updateMatrixWorld();

    // Color by time of day
    let sunColor, skyZenith, skyHorizon, groundColor, fogColor;

    if (t < 0.21) {
      // Night / pre-dawn
      sunColor = 0x4466aa;
      skyZenith = 0x0a0a1a;
      skyHorizon = 0x1a1a33;
      groundColor = 0x08080c;
      fogColor = 0x06060a;
    } else if (t < 0.30) {
      // Dawn
      const k = (t - 0.21) / 0.09;
      sunColor = new THREE.Color(0x4466aa).lerp(new THREE.Color(0xffaa66), k).getHex();
      skyZenith = new THREE.Color(0x0a0a1a).lerp(new THREE.Color(0x3a2a4a), k).getHex();
      skyHorizon = new THREE.Color(0x1a1a33).lerp(new THREE.Color(0xff8a55), k).getHex();
      groundColor = new THREE.Color(0x08080c).lerp(new THREE.Color(0x18120e), k).getHex();
      fogColor = new THREE.Color(0x06060a).lerp(new THREE.Color(0x120c0c), k).getHex();
    } else if (t < 0.58) {
      // Day
      const k = (t - 0.30) / 0.28;
      sunColor = new THREE.Color(0xffaa66).lerp(new THREE.Color(0xffffff), k).getHex();
      skyZenith = new THREE.Color(0x3a2a4a).lerp(new THREE.Color(0x7fb3d5), k).getHex();
      skyHorizon = new THREE.Color(0xff8a55).lerp(new THREE.Color(0xbfe3fd), k).getHex();
      groundColor = new THREE.Color(0x18120e).lerp(new THREE.Color(0x2a2a2a), k).getHex();
      fogColor = new THREE.Color(0x120c0c).lerp(new THREE.Color(0x0a0c12), k).getHex();
    } else if (t < 0.72) {
      // Dusk
      const k = (t - 0.58) / 0.14;
      sunColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0xff6633), k).getHex();
      skyZenith = new THREE.Color(0x7fb3d5).lerp(new THREE.Color(0x2a1a4a), k).getHex();
      skyHorizon = new THREE.Color(0xbfe3fd).lerp(new THREE.Color(0xff5544), k).getHex();
      groundColor = new THREE.Color(0x2a2a2a).lerp(new THREE.Color(0x120a08), k).getHex();
      fogColor = new THREE.Color(0x0a0c12).lerp(new THREE.Color(0x0a0606), k).getHex();
    } else {
      // Night
      const k = (t - 0.72) / 0.28;
      sunColor = new THREE.Color(0xff6633).lerp(new THREE.Color(0x4466aa), k).getHex();
      skyZenith = new THREE.Color(0x2a1a4a).lerp(new THREE.Color(0x0a0a1a), k).getHex();
      skyHorizon = new THREE.Color(0xff5544).lerp(new THREE.Color(0x1a1a33), k).getHex();
      groundColor = new THREE.Color(0x120a08).lerp(new THREE.Color(0x08080c), k).getHex();
      fogColor = new THREE.Color(0x0a0606).lerp(new THREE.Color(0x06060a), k).getHex();
    }

    sunLight.color.setHex(sunColor);
    sunLight.intensity = (t >= 0.30 && t < 0.72) ? 1.4 : 0.55;

    hemiLight.color.setHex(skyZenith);
    hemiLight.groundColor.setHex(groundColor);

    ambientLight.color.setHex(0x202030);
    ambientLight.intensity = (t >= 0.30 && t < 0.72) ? 0.5 : 0.35;

    scene.background = new THREE.Color(skyZenith);
    scene.fog.color.setHex(fogColor);

    if (skySphere) {
      skySphere.material.map = createGradientSkyTexture(skyZenith, skyHorizon);
      skySphere.material.map.needsUpdate = true;
    }

    // Update UI label
    const el = document.getElementById('tod-value');
    if (el) el.textContent = hour.toFixed(0) + ':00';

    state.timeOfDay = hour;
  }

  function createGradientSkyTexture(zenithHex, horizonHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, hexToCss(zenithHex));
    grad.addColorStop(1, hexToCss(horizonHex));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 256);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  function hexToCss(hex) {
    const r = ((hex >> 16) & 255) / 255;
    const g = ((hex >> 8) & 255) / 255;
    const b = (hex & 255) / 255;
    return 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
  }

  // --------------------------------------------------------------------------
  // Backdrop (minimalistic: gradient sky sphere + dark ground)
  // --------------------------------------------------------------------------
  function createBackdrop() {
    // Sky sphere (rendered inside-out)
    const skyGeo = new THREE.SphereGeometry(500, 60, 40);
    const skyMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      map: createGradientSkyTexture(0x7fb3d5, 0xbfe3fd),
    });
    skySphere = new THREE.Mesh(skyGeo, skyMat);
    skySphere.scale.x = -1;
    scene.add(skySphere);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.9,
      metalness: 0.1,
    });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle grid on ground
    const grid = new THREE.GridHelper(200, 40, 0x333344, 0x111118);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);
  }

  // --------------------------------------------------------------------------
  // Model loading (GLTF/GLB) — swap in when you provide raven.glb
  // --------------------------------------------------------------------------
  function loadModel(path) {
    const loader = new THREE.GLTFLoader();
    loader.load(
      path,
      function (gltf) {
        mechGroup = gltf.scene;
        mechGroup.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        // Center + scale roughly
        const box = new THREE.Box3().setFromObject(mechGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 8 / maxDim;
        mechGroup.scale.setScalar(scale);
        mechGroup.position.sub(center.multiplyScalar(scale));
        mechGroup.position.y = 0;
        mechGroup.rotation.y = Math.PI * 0.15; // face forward slightly angled
        scene.add(mechGroup);

        // Attach placeholder thrusters/flames if the model has none
        attachPlaceholderFlames();
      },
      undefined,
      function (err) {
        console.error('Failed to load model:', err);
        createPlaceholderMech();
      }
    );
  }

  function attachPlaceholderFlames() {
    // If the loaded model has no thrusters, add simple flame cones at the back
    const backPos = new THREE.Vector3(0, 0.6, -1.2);
    createFlamePair(backPos);
  }

  // --------------------------------------------------------------------------
  // Placeholder mech (built from primitives) + thruster flames
  // --------------------------------------------------------------------------
  function createPlaceholderMech() {
    mechGroup = new THREE.Group();

    const matBody = new THREE.MeshStandardMaterial({
      color: CONFIG.mechColor,
      roughness: 0.35,
      metalness: 0.85,
    });
    const matAccent = new THREE.MeshStandardMaterial({
      color: CONFIG.accentColor,
      emissive: CONFIG.glowColor,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.6,
    });
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x224466,
      transparent: true,
      opacity: 0.55,
      metalness: 0.1,
      roughness: 0.1,
    });

    // --- Body (torso) ---
    bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.1), matBody);
    bodyMesh.position.y = 0.9;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    mechGroup.add(bodyMesh);

    // Chest accent
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.6), matAccent);
    chest.position.set(0, 0.95, 0.56);
    chest.castShadow = true;
    mechGroup.add(chest);

    // --- Head / cockpit ---
    headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.7), matBody);
    headMesh.position.set(0, 2.15, 0.1);
    headMesh.castShadow = true;
    mechGroup.add(headMesh);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.4), matGlass);
    visor.position.set(0, 2.15, 0.36);
    mechGroup.add(visor);

    // --- Arms ---
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), matBody);
    armL.position.set(-1.15, 1.2, 0);
    armL.rotation.z = -0.15;
    armL.castShadow = true;
    mechGroup.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), matBody);
    armR.position.set(1.15, 1.2, 0);
    armR.rotation.z = 0.15;
    armR.castShadow = true;
    mechGroup.add(armR);

    // --- Legs ---
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.5, 0.6), matBody);
    legL.position.set(-0.55, 0.0, 0.1);
    legL.castShadow = true;
    mechGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.5, 0.6), matBody);
    legR.position.set(0.55, 0.0, 0.1);
    legR.castShadow = true;
    mechGroup.add(legR);

    // Feet
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.5), matAccent);
    footL.position.set(-0.55, -0.85, 0.25);
    footL.castShadow = true;
    mechGroup.add(footL);

    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.5), matAccent);
    footR.position.set(0.55, -0.85, 0.25);
    footR.castShadow = true;
    mechGroup.add(footR);

    // --- Back thruster unit ---
    thrusterGroup = new THREE.Group();
    thrusterGroup.position.set(0, 1.0, -0.62);
    const thruster = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.8), matBody);
    thruster.castShadow = true;
    thrusterGroup.add(thruster);
    const thrusterAccent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.45), matAccent);
    thrusterAccent.position.z = 0.42;
    thrusterGroup.add(thrusterAccent);
    mechGroup.add(thrusterGroup);

    // --- Thruster flames (dash effect) ---
    createFlamePair(new THREE.Vector3(0, 1.0, -1.05));

    // Facing forward slightly angled
    mechGroup.rotation.y = Math.PI * 0.05;

    scene.add(mechGroup);
  }

  function createFlamePair(centerPos) {
    // Two flame cones (left/right thruster)
    ['left', 'right'].forEach(function (side) {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 1.0, 12),
        new THREE.MeshBasicMaterial({
          color: CONFIG.flameColor,
          transparent: true,
          opacity: 0,
        })
      );
      flame.rotation.x = -Math.PI / 2; // point cone backward
      flame.position.set(side === 'left' ? -0.35 : 0.35, centerPos.y, centerPos.z);
      flame.visible = false;
      scene.add(flame);
      flameMeshes.push(flame);
    });

    // Core glow between thrusters
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.9, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffddaa,
        transparent: true,
        opacity: 0,
      })
    );
    core.rotation.x = Math.PI / 2;
    core.position.set(0, centerPos.y, centerPos.z);
    core.visible = false;
    scene.add(core);
    flameMeshes.push(core);
  }

  // --------------------------------------------------------------------------
  // Animation (dash: lean forward + thrusters flare)
  // --------------------------------------------------------------------------
  function updateAnimation(dt) {
    if (!mechGroup) return;

    const t = state.time;
    const cycle = (t % CONFIG.dashDuration) / CONFIG.dashDuration; // 0..1 dash cycle

    // Easing for the dash burst (quick flare, then settle)
    // dash intensity: rises fast at start, fades
    let dashIntensity = 0;
    if (state.isPlaying) {
      dashIntensity = Math.max(0, Math.sin(cycle * Math.PI)); // pulse 0->1->0 per cycle
    }

    // Lean forward when dashing
    const targetLean = CONFIG.leanAngle * dashIntensity;
    bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, targetLean, 0.15);
    headMesh.rotation.x = THREE.MathUtils.lerp(headMesh.rotation.x, targetLean * 0.6, 0.15);

    // Slight bobbing
    const bob = Math.sin(t * 4) * 0.02 * (1 - dashIntensity * 0.5);
    mechGroup.position.y = bob;

    // Thrusters flare during dash
    const flameStrength = dashIntensity;
    flameMeshes.forEach(function (flame, i) {
      flame.visible = flameStrength > 0.02;
      if (flameStrength > 0.02) {
        // Scale flame length & opacity with intensity
        const s = 0.6 + flameStrength * 1.4;
        flame.scale.set(s, s, s);
        flame.material.opacity = 0.35 + flameStrength * 0.55;
        // additive flicker
        flame.material.opacity += Math.sin(t * CONFIG.flamePulseSpeed + i) * 0.12 * flameStrength;
      }
    });

    // Slow idle hover rotation when not dashing
    if (!state.isPlaying) {
      mechGroup.rotation.y = Math.PI * 0.05 + Math.sin(t * 0.5) * 0.02;
    } else {
      mechGroup.rotation.y = THREE.MathUtils.lerp(
        mechGroup.rotation.y,
        Math.PI * 0.05,
        0.1
      );
    }
  }

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------
  function wireUI() {
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnRestart = document.getElementById('btn-restart');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const sliderTOD = document.getElementById('slider-tod');
    const sidebar = document.getElementById('sidebar');

    function setPlaying(p) {
      state.isPlaying = p;
      btnPlay.classList.toggle('active', p);
      btnPause.classList.toggle('active', !p);
    }

    btnPlay.addEventListener('click', function () { setPlaying(true); });
    btnPause.addEventListener('click', function () { setPlaying(false); });
    btnRestart.addEventListener('click', function () {
      state.time = 0;
      setPlaying(true);
    });

    btnToggleSidebar.addEventListener('click', function () {
      state.showSidebar = !state.showSidebar;
      sidebar.classList.toggle('collapsed', !state.showSidebar);
      btnToggleSidebar.textContent = state.showSidebar ? '◀ Collapse' : '▶ Expand';
      btnToggleSidebar.title = state.showSidebar ? 'Collapse sideboard' : 'Expand sideboard';
    });

    btnFullscreen.addEventListener('click', toggleFullscreen);

    sliderTOD.addEventListener('input', function (e) {
      updateTimeOfDay(parseFloat(e.target.value));
    });

    // Initialize UI
    setPlaying(true);
    sliderTOD.value = state.timeOfDay;
    document.getElementById('tod-value').textContent = state.timeOfDay.toFixed(0) + ':00';
    btnToggleSidebar.textContent = state.showSidebar ? '◀ Collapse' : '▶ Expand';
  }

  function toggleFullscreen() {
    const container = document.getElementById('canvas-container');
    const el = renderer.domElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(function () {
        console.warn('Fullscreen failed');
      });
      state.fullscreen = true;
      document.body.classList.add('fullscreen');
    } else {
      document.exitFullscreen();
      state.fullscreen = false;
      document.body.classList.remove('fullscreen');
    }
  }

  document.addEventListener('fullscreenchange', function () {
    state.fullscreen = !!document.fullscreenElement;
    document.body.classList.toggle('fullscreen', state.fullscreen);
  });

  // --------------------------------------------------------------------------
  // Simple orbit controls (drag rotate, scroll zoom, right-drag pan)
  // --------------------------------------------------------------------------
  function setupPointerControls() {
    const dom = renderer.domElement;

    dom.addEventListener('mousedown', function (e) {
      state.isDragging = true;
      state.lastMouse.set(e.clientX, e.clientY);
      if (e.button === 2) state.dragMode = 'pan';
      else state.dragMode = 'rotate';
    }, false);

    window.addEventListener('mouseup', function () {
      state.isDragging = false;
      delete state.dragMode;
    }, false);

    dom.addEventListener('mousemove', function (e) {
      if (!state.isDragging) return;
      const dx = e.clientX - state.lastMouse.x;
      const dy = e.clientY - state.lastMouse.y;
      state.lastMouse.set(e.clientX, e.clientY);

      if (state.dragMode === 'rotate') {
        orbit.theta -= dx * 0.004;
        orbit.phi += dy * 0.004;
        orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi));
      } else if (state.dragMode === 'pan') {
        const panSpeed = 0.001;
        orbit.target.x += -dx * panSpeed;
        orbit.target.y += dy * panSpeed;
      }
    }, false);

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      const zoom = e.deltaY > 0 ? 1.08 : 1 / 1.08;
      orbit.radius *= zoom;
      orbit.radius = Math.max(6, Math.min(45, orbit.radius));
    }, { passive: false });

    // Touch support
    dom.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        state.isDragging = true;
        state.lastMouse.set(e.touches[0].clientX, e.touches[0].clientY);
        state.dragMode = 'rotate';
      }
    }, { passive: false });

    dom.addEventListener('touchmove', function (e) {
      if (!state.isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - state.lastMouse.x;
      const dy = e.touches[0].clientY - state.lastMouse.y;
      state.lastMouse.set(e.touches[0].clientX, e.touches[0].clientY);
      orbit.theta -= dx * 0.006;
      orbit.phi += dy * 0.006;
      orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi));
    }, { passive: false });

    dom.addEventListener('touchend', function () {
      state.isDragging = false;
      delete state.dragMode;
    }, false);
  }

  // --------------------------------------------------------------------------
  // Camera update + render
  // --------------------------------------------------------------------------
  function updateCamera() {
    const x = orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    const y = orbit.radius * Math.cos(orbit.phi);
    const z = orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    camera.position.set(orbit.target.x + x, orbit.target.y + y, orbit.target.z + z);
    camera.lookAt(orbit.target);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --------------------------------------------------------------------------
  // Main loop
  // --------------------------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    state.time += dt * state.speed;

    updateAnimation(dt);
    updateCamera();

    renderer.render(scene, camera);
  }

  // --------------------------------------------------------------------------
  // Boot
  // --------------------------------------------------------------------------
  init();
  setupPointerControls();

})();
