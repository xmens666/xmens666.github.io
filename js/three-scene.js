/**
 * Three.js 3D Zen Meditation Particle Cloud
 * ES Module with UnrealBloomPass post-processing
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.zenScene = { setScrollProgress: function () {} };
    return;
  }

  const isMobile = window.innerWidth <= 768;

  // --- Config ---
  const BG_PARTICLE_COUNT = isMobile ? 600 : 1200;
  const CONNECTION_DISTANCE = isMobile ? 100 : 120;
  const CONNECTION_MAX = isMobile ? 300 : 600;
  const COLORS = {
    green: 0x00ffa3,
    darkGreen: 0x007a48,
    gold: 0xb8976a,
    white: 0xffffff,
  };
  const COLOR_ARRAY = [COLORS.green, COLORS.darkGreen, COLORS.gold, COLORS.white];
  const COLOR_WEIGHTS = [0.4, 0.25, 0.2, 0.15];

  // --- State ---
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let frameCount = 0;
  let scene, camera, renderer, composer, bloomPass;
  let bgParticleSystem, bgPositions, bgVelocities;
  let connectionGeometry, connectionMesh;
  let zenFigure, zenOriginal, zenPointTypes;
  let icosahedron;

  function pickColor() {
    const r = Math.random();
    let c = 0;
    for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
      c += COLOR_WEIGHTS[i];
      if (r <= c) return COLOR_ARRAY[i];
    }
    return COLOR_ARRAY[0];
  }

  function createGlowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const h = size / 2;
    const g = ctx.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.15, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.3)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }

  // --- Load point cloud JSON ---
  async function loadZenPoints() {
    const path = isMobile ? 'models/zen-points-mobile.json' : 'models/zen-points.json';
    try {
      const res = await fetch(path);
      return await res.json();
    } catch (e) {
      console.warn('Failed to load zen points:', e);
      return null;
    }
  }

  // --- Build zen figure from loaded data ---
  function createZenFigure(data) {
    const count = data.count;
    const rawPos = data.positions; // flat array [x,y,z,x,y,z,...]
    const types = data.types;     // 0=volume, 1=surface

    // Add aura and trail particles
    const auraCount = isMobile ? 300 : 600;
    const trailCount = isMobile ? 200 : 400;
    const groundCount = isMobile ? 150 : 300;
    const totalCount = count + auraCount + trailCount + groundCount;

    const positions = new Float32Array(totalCount * 3);
    const original = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    const pointTypes = new Int8Array(totalCount); // 0=volume, 1=surface, 2=aura, 3=trail

    const color = new THREE.Color();

    // Copy model points
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = rawPos[i3];
      positions[i3 + 1] = rawPos[i3 + 1];
      positions[i3 + 2] = rawPos[i3 + 2];
      original[i3] = rawPos[i3];
      original[i3 + 1] = rawPos[i3 + 1];
      original[i3 + 2] = rawPos[i3 + 2];
      pointTypes[i] = types[i];

      const rnd = Math.random();
      if (types[i] === 1) {
        // Surface: bright, defines silhouette
        if (rnd < 0.5) color.setHex(COLORS.green);
        else if (rnd < 0.75) color.setHex(0xffffff);
        else if (rnd < 0.9) color.setHex(0x80ffd0);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 2.5 + rnd * 2.0 : 2.0 + rnd * 2.5;
      } else {
        // Volume: fills body
        if (rnd < 0.4) color.setHex(0x00cc80);
        else if (rnd < 0.7) color.setHex(COLORS.green);
        else color.setHex(0x00dd90);
        sizes[i] = isMobile ? 1.5 + rnd * 1.2 : 1.2 + rnd * 1.5;
      }
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    // Aura particles (orbiting around figure)
    let idx = count;
    for (let i = 0; i < auraCount; i++, idx++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI - Math.PI * 0.3;
      const dist = 55 + Math.random() * 45;
      const ax = Math.cos(angle) * Math.cos(elevation) * dist;
      const ay = Math.sin(elevation) * dist;
      const az = Math.sin(angle) * Math.cos(elevation) * dist * 0.6;
      const i3 = idx * 3;
      positions[i3] = ax; positions[i3 + 1] = ay; positions[i3 + 2] = az;
      original[i3] = ax; original[i3 + 1] = ay; original[i3 + 2] = az;
      pointTypes[idx] = 2;
      const rnd = Math.random();
      if (rnd < 0.5) color.setHex(COLORS.green);
      else if (rnd < 0.8) color.setHex(0x00cc80);
      else color.setHex(COLORS.gold);
      colors[i3] = color.r; colors[i3 + 1] = color.g; colors[i3 + 2] = color.b;
      sizes[idx] = isMobile ? 4 + rnd * 4 : 3.5 + rnd * 5.5;
    }

    // Energy trail (upward from top)
    for (let i = 0; i < trailCount; i++, idx++) {
      const t = Math.random();
      const spread = t * 25;
      const tx = (Math.random() - 0.5) * spread;
      const ty = 85 + t * 80;
      const tz = (Math.random() - 0.5) * spread * 0.5;
      const i3 = idx * 3;
      positions[i3] = tx; positions[i3 + 1] = ty; positions[i3 + 2] = tz;
      original[i3] = tx; original[i3 + 1] = ty; original[i3 + 2] = tz;
      pointTypes[idx] = 3;
      const rnd = Math.random();
      if (rnd < 0.35) color.setHex(0xffffff);
      else if (rnd < 0.65) color.setHex(COLORS.green);
      else if (rnd < 0.85) color.setHex(0x80ffd0);
      else color.setHex(COLORS.gold);
      colors[i3] = color.r; colors[i3 + 1] = color.g; colors[i3 + 2] = color.b;
      sizes[idx] = isMobile ? 1.5 + rnd * 2.5 : 1.2 + rnd * 3.5;
    }

    // Ground glow
    for (let i = 0; i < groundCount; i++, idx++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      const gx = Math.cos(angle) * dist;
      const gy = -90 + (Math.random() - 0.5) * 4;
      const gz = Math.sin(angle) * dist * 0.5;
      const i3 = idx * 3;
      positions[i3] = gx; positions[i3 + 1] = gy; positions[i3 + 2] = gz;
      original[i3] = gx; original[i3 + 1] = gy; original[i3 + 2] = gz;
      pointTypes[idx] = 2;
      const rnd = Math.random();
      color.setHex(rnd < 0.6 ? COLORS.green : 0x00cc80);
      colors[i3] = color.r; colors[i3 + 1] = color.g; colors[i3 + 2] = color.b;
      sizes[idx] = isMobile ? 3 + rnd * 3 : 2.5 + rnd * 4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const glowTexture = createGlowTexture();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: glowTexture },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;
        uniform float uTime;

        // Simple noise
        float hash(vec3 p) {
          p = fract(p * vec3(443.8975, 397.2973, 491.1871));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mvPosition.xyz);
          vAlpha = clamp(1.0 - dist / 1200.0, 0.4, 1.0);

          // Noise-based subtle displacement
          float n = hash(position + uTime * 0.1);
          float displacement = sin(uTime * 0.5 + n * 6.28) * 0.3;
          mvPosition.x += displacement;

          gl_PointSize = size * uPixelRatio * (380.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 50.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          float a = texColor.a * vAlpha * 0.98;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor * (0.8 + texColor.r * 0.4), a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    zenFigure = new THREE.Points(geometry, material);
    zenOriginal = original;
    zenPointTypes = pointTypes;
    zenFigure.userData.totalCount = totalCount;
    zenFigure.userData.modelCount = count;

    // Position
    zenFigure.position.set(
      isMobile ? 0 : 180,
      isMobile ? -20 : -30,
      isMobile ? 80 : -30
    );

    scene.add(zenFigure);
  }

  // --- Background particles ---
  function createBgParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(BG_PARTICLE_COUNT * 3);
    const col = new Float32Array(BG_PARTICLE_COUNT * 3);
    const sz = new Float32Array(BG_PARTICLE_COUNT);
    const vel = new Float32Array(BG_PARTICLE_COUNT * 3);
    const spread = isMobile ? 800 : 1200;
    const depth = isMobile ? 1000 : 1500;
    const c = new THREE.Color();

    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * spread;
      pos[i3 + 1] = (Math.random() - 0.5) * spread;
      pos[i3 + 2] = (Math.random() - 0.5) * depth;
      vel[i3] = (Math.random() - 0.5) * 0.15;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.15;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.1;
      c.setHex(pickColor());
      col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
      sz[i] = isMobile ? Math.random() * 5 + 2.5 : Math.random() * 4 + 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));

    const glowTexture = createGlowTexture();
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: glowTexture },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * ${isMobile ? '1.0' : '0.85'});
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    bgParticleSystem = new THREE.Points(geo, mat);
    bgPositions = pos;
    bgVelocities = vel;
    scene.add(bgParticleSystem);
  }

  // --- Connections ---
  function createConnections() {
    const maxVerts = CONNECTION_MAX * 2;
    const pos = new Float32Array(maxVerts * 3);
    const col = new Float32Array(maxVerts * 3);
    connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    connectionGeometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    connectionGeometry.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true,
      opacity: isMobile ? 0.5 : 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    connectionMesh = new THREE.LineSegments(connectionGeometry, mat);
    scene.add(connectionMesh);
  }

  function updateConnections() {
    const pos = connectionGeometry.attributes.position.array;
    const col = connectionGeometry.attributes.color.array;
    const pp = bgPositions;
    let vc = 0;
    const dSq = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
    const step = isMobile ? 5 : 3;

    for (let i = 0; i < BG_PARTICLE_COUNT && vc < CONNECTION_MAX * 2; i += step) {
      const ix = pp[i * 3], iy = pp[i * 3 + 1], iz = pp[i * 3 + 2];
      for (let j = i + step; j < BG_PARTICLE_COUNT && vc < CONNECTION_MAX * 2; j += step) {
        const dx = ix - pp[j * 3], dy = iy - pp[j * 3 + 1], dz = iz - pp[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < dSq) {
          const a = 1 - Math.sqrt(d2) / CONNECTION_DISTANCE;
          pos[vc * 3] = ix; pos[vc * 3 + 1] = iy; pos[vc * 3 + 2] = iz;
          col[vc * 3] = 0; col[vc * 3 + 1] = a * 0.6 + 0.4; col[vc * 3 + 2] = a * 0.1;
          vc++;
          pos[vc * 3] = pp[j * 3]; pos[vc * 3 + 1] = pp[j * 3 + 1]; pos[vc * 3 + 2] = pp[j * 3 + 2];
          col[vc * 3] = 0; col[vc * 3 + 1] = a * 0.4 + 0.2; col[vc * 3 + 2] = a * 0.1;
          vc++;
        }
      }
    }
    connectionGeometry.setDrawRange(0, vc);
    connectionGeometry.attributes.position.needsUpdate = true;
    connectionGeometry.attributes.color.needsUpdate = true;
  }

  // --- Icosahedron ---
  function createIcosahedron() {
    const geo = new THREE.IcosahedronGeometry(40, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS.gold, wireframe: true, transparent: true,
      opacity: isMobile ? 0.35 : 0.22,
      blending: THREE.AdditiveBlending,
    });
    icosahedron = new THREE.Mesh(geo, mat);
    icosahedron.position.set(200, 0, -100);
    scene.add(icosahedron);
  }

  // --- Init ---
  async function init() {
    const canvas = document.createElement('canvas');
    canvas.id = 'three-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    renderer = new THREE.WebGLRenderer({
      canvas, antialias: !isMobile, alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a1f1a, 1);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x061510, 0.0008);

    // Background gradient
    const bgC = document.createElement('canvas');
    bgC.width = 2; bgC.height = 512;
    const bgCtx = bgC.getContext('2d');
    const bgG = bgCtx.createLinearGradient(0, 0, 0, 512);
    bgG.addColorStop(0, '#0a1f1a');
    bgG.addColorStop(0.5, '#081a15');
    bgG.addColorStop(1, '#061510');
    bgCtx.fillStyle = bgG;
    bgCtx.fillRect(0, 0, 2, 512);
    scene.background = new THREE.CanvasTexture(bgC);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 0, 500);

    // Post-processing: bloom
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      isMobile ? 1.0 : 1.2,   // strength
      0.5,                     // radius
      0.3                      // threshold (lower = more glow)
    );
    composer.addPass(bloomPass);

    // Build scene
    createBgParticles();
    createIcosahedron();
    createConnections();

    // Load and create zen figure
    const zenData = await loadZenPoints();
    if (zenData) {
      createZenFigure(zenData);
    }

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onResize, false);

    animate();
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(window.innerWidth, window.innerHeight);
    if (bgParticleSystem && bgParticleSystem.material.uniforms) {
      bgParticleSystem.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    }
    if (zenFigure && zenFigure.material.uniforms) {
      zenFigure.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    }
  }

  function setScrollProgress(progress) {
    targetScrollProgress = progress;
  }

  // --- Animate ---
  function animate() {
    requestAnimationFrame(animate);
    frameCount++;
    const time = performance.now() * 0.001;

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

    // Camera
    camera.rotation.y = mouseX * 0.05;
    camera.rotation.x = mouseY * 0.03;
    camera.position.z = 500 - scrollProgress * 800;

    // Dynamic bloom: increases as user scrolls into scene
    if (bloomPass) {
      bloomPass.strength = (isMobile ? 0.6 : 0.8) + scrollProgress * 0.4;
    }

    // --- Background particles ---
    const spread = 600, depthSpread = 750;
    const pp = bgPositions, pv = bgVelocities;
    const camZ = camera.position.z;

    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pp[i3] += pv[i3];
      pp[i3 + 1] += pv[i3 + 1];
      pp[i3 + 2] += pv[i3 + 2];

      if (pp[i3] > spread) pp[i3] = -spread;
      else if (pp[i3] < -spread) pp[i3] = spread;
      if (pp[i3 + 1] > spread) pp[i3 + 1] = -spread;
      else if (pp[i3 + 1] < -spread) pp[i3 + 1] = spread;
      if (pp[i3 + 2] > depthSpread) pp[i3 + 2] = -depthSpread;
      else if (pp[i3 + 2] < -depthSpread) pp[i3 + 2] = depthSpread;

      const dz = pp[i3 + 2] - camZ;
      if (Math.abs(dz) < 80) {
        const push = (1 - Math.abs(dz) / 80) * 2;
        const dx = pp[i3], dy = pp[i3 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        pp[i3] += (dx / dist) * push;
        pp[i3 + 1] += (dy / dist) * push;
      }
    }
    bgParticleSystem.geometry.attributes.position.needsUpdate = true;
    bgParticleSystem.rotation.y = time * 0.015;
    bgParticleSystem.rotation.x = Math.sin(time * 0.01) * 0.03;

    // --- Zen figure animation ---
    if (zenFigure) {
      const positions = zenFigure.geometry.attributes.position.array;
      const totalCount = zenFigure.userData.totalCount;
      const breathe = Math.sin(time * 0.5) * 0.008;

      zenFigure.material.uniforms.uTime.value = time;

      for (let i = 0; i < totalCount; i++) {
        const i3 = i * 3;
        const ox = zenOriginal[i3], oy = zenOriginal[i3 + 1], oz = zenOriginal[i3 + 2];
        const type = zenPointTypes[i];
        const phase = i * 0.23;

        if (type <= 1) {
          // Body/surface: breathing + subtle float
          const b = breathe * (1 + oy * 0.003);
          positions[i3] = ox * (1 + b) + Math.sin(time * 0.3 + phase) * 0.15;
          positions[i3 + 1] = oy * (1 + b * 0.5) + Math.cos(time * 0.25 + phase) * 0.12;
          positions[i3 + 2] = oz * (1 + b) + Math.sin(time * 0.2 + phase) * 0.15;
        } else if (type === 2) {
          // Aura/ground: gentle orbit
          positions[i3] = ox + Math.sin(time * 0.2 + phase) * 2.5;
          positions[i3 + 1] = oy + Math.sin(time * 0.35 + phase) * 1.5;
          positions[i3 + 2] = oz + Math.cos(time * 0.15 + phase) * 2;
        } else {
          // Trail: rising energy
          const speed = 5 + (i % 5) * 2;
          const cycle = ((time * speed + phase * 40) % 180) / 180;
          positions[i3] = ox + Math.sin(time * 0.2 + phase) * (2 + cycle * 12);
          positions[i3 + 1] = oy + cycle * 50;
          positions[i3 + 2] = oz + Math.cos(time * 0.25 + phase) * (1.5 + cycle * 8);
        }
      }
      zenFigure.geometry.attributes.position.needsUpdate = true;
      zenFigure.rotation.y = time * 0.06;
    }

    // --- Icosahedron orbit ---
    const orbitR = 250;
    icosahedron.position.x = Math.cos(time * 0.3) * orbitR;
    icosahedron.position.y = Math.sin(time * 0.2) * 80;
    icosahedron.position.z = Math.sin(time * 0.3) * orbitR - 100;
    icosahedron.rotation.x = time * 0.4;
    icosahedron.rotation.y = time * 0.6;

    // Connections (throttled)
    if (frameCount % 3 === 0) updateConnections();

    // Render with bloom
    composer.render();
  }

  // --- Boot ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.zenScene = { setScrollProgress };
})();
