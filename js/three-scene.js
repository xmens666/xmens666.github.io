/**
 * Three.js 3D Background Scene for zencode.jp
 * Replaces particles.js with a full 3D immersive space environment
 */
(function () {
  'use strict';

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.zenScene = { setScrollProgress: function() {} };
    return;
  }

  // --- Config ---
  const isMobile = window.innerWidth <= 768;
  const PARTICLE_COUNT = isMobile ? 800 : 1500;
  const CONNECTION_DISTANCE = isMobile ? 100 : 120;
  const CONNECTION_MAX = isMobile ? 400 : 800;
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
  let scene, camera, renderer;
  let particleSystem, particlePositions, particleVelocities, particleSizes;
  let connectionGeometry, connectionMaterial, connectionMesh;
  let zenFigure, icosahedron, zenFigurePositions, zenFigureOriginal;

  // --- Glow texture (procedural) ---
  function createGlowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.05)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // --- Weighted random color pick ---
  function pickColor() {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
      cumulative += COLOR_WEIGHTS[i];
      if (r <= cumulative) return COLOR_ARRAY[i];
    }
    return COLOR_ARRAY[0];
  }

  // --- Init ---
  function init() {
    // Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'three-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a1f1a, 1);

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x061510, 0.0008);

    // Background gradient via a large plane
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d');
    const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#0a1f1a');
    bgGrad.addColorStop(0.5, '#081a15');
    bgGrad.addColorStop(1, '#061510');
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, 2, 512);
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    scene.background = bgTexture;

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 0, 500);

    // Build scene
    createParticles();
    createWireframes();
    createConnections();

    // Events
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onResize, false);

    // Start
    animate();
  }

  // --- Particles ---
  function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    const spread = isMobile ? 800 : 1200;
    const depthSpread = isMobile ? 1000 : 1500;
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * depthSpread;

      velocities[i3] = (Math.random() - 0.5) * 0.15;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.15;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      color.setHex(pickColor());
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = isMobile ? Math.random() * 6 + 3 : Math.random() * 4 + 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const glowTexture = createGlowTexture();

    // Custom shader material for size attenuation with per-particle sizes
    const material = new THREE.ShaderMaterial({
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

    particleSystem = new THREE.Points(geometry, material);
    particlePositions = positions;
    particleVelocities = velocities;
    particleSizes = sizes;
    scene.add(particleSystem);
  }

  // --- Zen meditation figure (3D particle cloud) ---
  function createZenFigure() {
    const W = 512, H = 512;
    const oc = document.createElement('canvas');
    oc.width = W; oc.height = H;
    const o = oc.getContext('2d');

    const cx = W / 2, cy = H * 0.38, s = W / 160;

    // --- Draw refined meditation silhouette ---
    o.fillStyle = '#fff';

    // Head — smooth oval with crown point
    o.beginPath();
    o.ellipse(cx, cy - 78*s, 15*s, 18*s, 0, 0, Math.PI * 2);
    o.fill();
    // Crown highlight bump
    o.beginPath();
    o.ellipse(cx, cy - 97*s, 5*s, 4*s, 0, 0, Math.PI * 2);
    o.fill();

    // Neck
    o.beginPath();
    o.moveTo(cx - 6*s, cy - 61*s);
    o.bezierCurveTo(cx - 7*s, cy - 55*s, cx - 8*s, cy - 50*s, cx - 10*s, cy - 46*s);
    o.lineTo(cx + 10*s, cy - 46*s);
    o.bezierCurveTo(cx + 8*s, cy - 50*s, cx + 7*s, cy - 55*s, cx + 6*s, cy - 61*s);
    o.closePath(); o.fill();

    // Shoulders + upper torso
    o.beginPath();
    o.moveTo(cx - 10*s, cy - 46*s);
    o.bezierCurveTo(cx - 25*s, cy - 44*s, cx - 42*s, cy - 40*s, cx - 46*s, cy - 35*s);
    o.bezierCurveTo(cx - 50*s, cy - 28*s, cx - 48*s, cy - 15*s, cx - 42*s, cy - 5*s);
    o.bezierCurveTo(cx - 36*s, cy + 5*s, cx - 20*s, cy + 15*s, cx, cy + 20*s);
    o.bezierCurveTo(cx + 20*s, cy + 15*s, cx + 36*s, cy + 5*s, cx + 42*s, cy - 5*s);
    o.bezierCurveTo(cx + 48*s, cy - 15*s, cx + 50*s, cy - 28*s, cx + 46*s, cy - 35*s);
    o.bezierCurveTo(cx + 42*s, cy - 40*s, cx + 25*s, cy - 44*s, cx + 10*s, cy - 46*s);
    o.closePath(); o.fill();

    // Left arm (outer curve to hand in lap)
    o.beginPath();
    o.moveTo(cx - 44*s, cy - 35*s);
    o.bezierCurveTo(cx - 56*s, cy - 25*s, cx - 62*s, cy - 8*s, cx - 55*s, cy + 10*s);
    o.bezierCurveTo(cx - 48*s, cy + 25*s, cx - 35*s, cy + 30*s, cx - 18*s, cy + 22*s);
    o.lineTo(cx - 22*s, cy + 14*s);
    o.bezierCurveTo(cx - 34*s, cy + 20*s, cx - 42*s, cy + 16*s, cx - 46*s, cy + 5*s);
    o.bezierCurveTo(cx - 52*s, cy - 8*s, cx - 48*s, cy - 22*s, cx - 38*s, cy - 30*s);
    o.closePath(); o.fill();

    // Right arm (mirror)
    o.beginPath();
    o.moveTo(cx + 44*s, cy - 35*s);
    o.bezierCurveTo(cx + 56*s, cy - 25*s, cx + 62*s, cy - 8*s, cx + 55*s, cy + 10*s);
    o.bezierCurveTo(cx + 48*s, cy + 25*s, cx + 35*s, cy + 30*s, cx + 18*s, cy + 22*s);
    o.lineTo(cx + 22*s, cy + 14*s);
    o.bezierCurveTo(cx + 34*s, cy + 20*s, cx + 42*s, cy + 16*s, cx + 46*s, cy + 5*s);
    o.bezierCurveTo(cx + 52*s, cy - 8*s, cx + 48*s, cy - 22*s, cx + 38*s, cy - 30*s);
    o.closePath(); o.fill();

    // Hands in lap (mudra — two overlapping ovals)
    o.beginPath(); o.ellipse(cx - 6*s, cy + 18*s, 12*s, 6*s, 0.15, 0, Math.PI * 2); o.fill();
    o.beginPath(); o.ellipse(cx + 6*s, cy + 18*s, 12*s, 6*s, -0.15, 0, Math.PI * 2); o.fill();

    // Crossed legs — lotus position
    o.beginPath();
    o.moveTo(cx - 55*s, cy + 38*s);
    o.bezierCurveTo(cx - 50*s, cy + 28*s, cx - 30*s, cy + 22*s, cx, cy + 24*s);
    o.bezierCurveTo(cx + 30*s, cy + 22*s, cx + 50*s, cy + 28*s, cx + 55*s, cy + 38*s);
    o.bezierCurveTo(cx + 52*s, cy + 50*s, cx + 30*s, cy + 54*s, cx, cy + 50*s);
    o.bezierCurveTo(cx - 30*s, cy + 54*s, cx - 52*s, cy + 50*s, cx - 55*s, cy + 38*s);
    o.closePath(); o.fill();

    // Left foot
    o.beginPath(); o.ellipse(cx + 28*s, cy + 36*s, 15*s, 7*s, -0.2, 0, Math.PI * 2); o.fill();
    // Right foot (tucked under)
    o.beginPath(); o.ellipse(cx - 20*s, cy + 44*s, 14*s, 6*s, 0.25, 0, Math.PI * 2); o.fill();

    // --- Sample with edge detection for sharper outline ---
    const imgData = o.getImageData(0, 0, W, H);
    const alpha = imgData.data;
    const figScale = isMobile ? 0.55 : 0.7;
    const points = [], pointTypes = []; // types: 0=core, 1=edge, 2=aura, 3=trail

    // Helper: check if pixel is at edge
    function isEdge(x, y) {
      if (x <= 0 || x >= W-1 || y <= 0 || y >= H-1) return false;
      const c = alpha[(y * W + x) * 4 + 3];
      if (c < 64) return false;
      // Check neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const n = alpha[((y+dy) * W + (x+dx)) * 4 + 3];
          if (n < 64) return true;
        }
      }
      return false;
    }

    // Layer 1: Dense edge particles (outline definition)
    const edgeStep = isMobile ? 1.5 : 1;
    for (let y = 0; y < H; y += edgeStep) {
      for (let x = 0; x < W; x += edgeStep) {
        if (isEdge(Math.floor(x), Math.floor(y))) {
          const px = (x - cx) * figScale;
          const py = -(y - cy) * figScale;
          const pz = (Math.random() - 0.5) * 15 * figScale;
          points.push(px, py, pz);
          pointTypes.push(1);
        }
      }
    }

    // Layer 2: Core body particles (sparser interior fill)
    const coreStep = isMobile ? 5 : 3.5;
    for (let y = 0; y < H; y += coreStep) {
      for (let x = 0; x < W; x += coreStep) {
        const idx = (Math.floor(y) * W + Math.floor(x)) * 4 + 3;
        if (alpha[idx] > 128 && !isEdge(Math.floor(x), Math.floor(y))) {
          const px = (x - cx) * figScale;
          const py = -(y - cy) * figScale;
          const pz = (Math.random() - 0.5) * 25 * figScale;
          points.push(px, py, pz);
          pointTypes.push(0);
        }
      }
    }

    // Layer 3: Aura particles (glow around the body)
    const auraCount = isMobile ? 200 : 400;
    for (let i = 0; i < auraCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const baseY = cy - 30*s + Math.random() * 80*s; // concentrated around torso
      const baseX = cx;
      // Find nearest body edge at this height
      let edgeDist = 40*s;
      for (let x = 0; x < W; x++) {
        if (isEdge(x, Math.floor(baseY))) {
          const d = Math.abs(x - baseX);
          if (d > edgeDist - 10*s) edgeDist = d;
        }
      }
      const dist = edgeDist + 5*s + Math.random() * 25*s;
      const ax = baseX + Math.cos(angle) * dist;
      const ay = baseY + (Math.random() - 0.5) * 15*s;
      const px = (ax - cx) * figScale;
      const py = -(ay - cy) * figScale;
      const pz = (Math.random() - 0.5) * 50 * figScale;
      points.push(px, py, pz);
      pointTypes.push(2);
    }

    // Layer 4: Energy trail particles (upward streams from head/shoulders)
    const trailCount = isMobile ? 120 : 250;
    for (let i = 0; i < trailCount; i++) {
      const t = Math.random();
      // Start from head/shoulder area, drift upward and outward
      const startX = cx + (Math.random() - 0.5) * 30*s;
      const startY = cy - 80*s - t * 60*s; // float upward
      const drift = (Math.random() - 0.5) * t * 40*s; // spread with distance
      const px = (startX + drift - cx) * figScale;
      const py = -(startY - cy) * figScale;
      const pz = (Math.random() - 0.5) * 40 * figScale;
      points.push(px, py, pz);
      pointTypes.push(3);
    }

    // --- Build geometry ---
    const count = points.length / 3;
    const positions = new Float32Array(points);
    const original = new Float32Array(points);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const type = pointTypes[i];
      const rnd = Math.random();

      if (type === 1) {
        // Edge: bright green/white for sharp outline
        if (rnd < 0.6) color.setHex(COLORS.green);
        else if (rnd < 0.85) color.setHex(COLORS.white);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 2.0 + rnd * 1.5 : 1.5 + rnd * 2;
      } else if (type === 0) {
        // Core: dimmer, smaller
        if (rnd < 0.5) color.setHex(0x00cc80);
        else if (rnd < 0.8) color.setHex(COLORS.darkGreen);
        else color.setHex(COLORS.green);
        sizes[i] = isMobile ? 1.2 + rnd : 1 + rnd * 1.5;
      } else if (type === 2) {
        // Aura: large, dim glow
        if (rnd < 0.5) color.setHex(COLORS.green);
        else if (rnd < 0.8) color.setHex(0x00cc80);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 3 + rnd * 4 : 3 + rnd * 5;
      } else {
        // Trail: bright, varied size
        if (rnd < 0.4) color.setHex(COLORS.white);
        else if (rnd < 0.7) color.setHex(COLORS.green);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 1.5 + rnd * 3 : 1.5 + rnd * 4;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
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
      },
      vertexShader: [
        'attribute float size;',
        'varying vec3 vColor;',
        'uniform float uPixelRatio;',
        'void main() {',
        '  vColor = color;',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);',
        '  gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTexture;',
        'varying vec3 vColor;',
        'void main() {',
        '  vec4 texColor = texture2D(uTexture, gl_PointCoord);',
        '  gl_FragColor = vec4(vColor, texColor.a * 0.92);',
        '}'
      ].join('\n'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    zenFigure = new THREE.Points(geometry, material);
    zenFigurePositions = positions;
    zenFigureOriginal = original;
    // Store type info for animation
    zenFigure.userData.pointTypes = pointTypes;
    zenFigure.userData.pointCount = count;
    zenFigure.position.set(isMobile ? 0 : 200, 0, -50);
    scene.add(zenFigure);
  }

  // --- Wireframe shapes ---
  function createWireframes() {
    // Zen figure replaces torus knot
    createZenFigure();

    // Icosahedron - orbiting
    const icoGeo = new THREE.IcosahedronGeometry(40, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: COLORS.gold,
      wireframe: true,
      transparent: true,
      opacity: isMobile ? 0.35 : 0.22,
      blending: THREE.AdditiveBlending,
    });
    icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.position.set(200, 0, -100);
    scene.add(icosahedron);
  }

  // --- Connection lines ---
  function createConnections() {
    // Pre-allocate buffer for max connections
    const maxVertices = CONNECTION_MAX * 2;
    const positions = new Float32Array(maxVertices * 3);
    const colors = new Float32Array(maxVertices * 3);

    connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    connectionGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    connectionGeometry.setDrawRange(0, 0);

    connectionMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isMobile ? 0.5 : 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    connectionMesh = new THREE.LineSegments(connectionGeometry, connectionMaterial);
    scene.add(connectionMesh);
  }

  function updateConnections() {
    const positions = connectionGeometry.attributes.position.array;
    const colors = connectionGeometry.attributes.color.array;
    const pp = particlePositions;
    let vertexCount = 0;
    const distSq = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
    const maxPairs = CONNECTION_MAX;

    // Only check a subset each frame for performance
    const step = isMobile ? 5 : 3;

    for (let i = 0; i < PARTICLE_COUNT && vertexCount < maxPairs * 2; i += step) {
      const ix = pp[i * 3];
      const iy = pp[i * 3 + 1];
      const iz = pp[i * 3 + 2];

      for (let j = i + step; j < PARTICLE_COUNT && vertexCount < maxPairs * 2; j += step) {
        const dx = ix - pp[j * 3];
        const dy = iy - pp[j * 3 + 1];
        const dz = iz - pp[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;

        if (d2 < distSq) {
          const alpha = 1 - Math.sqrt(d2) / CONNECTION_DISTANCE;
          const g = 0.0 + alpha * 0.4;
          const r = alpha * 0.0;
          const b = alpha * 0.1;

          // Vertex A
          positions[vertexCount * 3] = ix;
          positions[vertexCount * 3 + 1] = iy;
          positions[vertexCount * 3 + 2] = iz;
          colors[vertexCount * 3] = r;
          colors[vertexCount * 3 + 1] = g + 0.4;
          colors[vertexCount * 3 + 2] = b;
          vertexCount++;

          // Vertex B
          positions[vertexCount * 3] = pp[j * 3];
          positions[vertexCount * 3 + 1] = pp[j * 3 + 1];
          positions[vertexCount * 3 + 2] = pp[j * 3 + 2];
          colors[vertexCount * 3] = r;
          colors[vertexCount * 3 + 1] = g + 0.2;
          colors[vertexCount * 3 + 2] = b;
          vertexCount++;
        }
      }
    }

    connectionGeometry.setDrawRange(0, vertexCount);
    connectionGeometry.attributes.position.needsUpdate = true;
    connectionGeometry.attributes.color.needsUpdate = true;
  }

  // --- Mouse ---
  function onMouseMove(e) {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  // --- Resize ---
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (particleSystem && particleSystem.material.uniforms) {
      particleSystem.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    }
  }

  // --- Scroll ---
  function setScrollProgress(progress) {
    targetScrollProgress = progress;
  }

  // --- Animate ---
  function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    const time = performance.now() * 0.001;

    // Lerp mouse
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Lerp scroll
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

    // Camera parallax + scroll
    camera.rotation.y = mouseX * 0.05;
    camera.rotation.x = mouseY * 0.03;
    camera.position.z = 500 - scrollProgress * 800;

    // Update particles
    const spread = 600;
    const depthSpread = 750;
    const pp = particlePositions;
    const pv = particleVelocities;
    const camZ = camera.position.z;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Drift
      pp[i3] += pv[i3];
      pp[i3 + 1] += pv[i3 + 1];
      pp[i3 + 2] += pv[i3 + 2];

      // Wrap around boundaries
      if (pp[i3] > spread) pp[i3] = -spread;
      else if (pp[i3] < -spread) pp[i3] = spread;
      if (pp[i3 + 1] > spread) pp[i3 + 1] = -spread;
      else if (pp[i3 + 1] < -spread) pp[i3 + 1] = spread;
      if (pp[i3 + 2] > depthSpread) pp[i3 + 2] = -depthSpread;
      else if (pp[i3 + 2] < -depthSpread) pp[i3 + 2] = depthSpread;

      // Push aside particles near camera (fly-through effect)
      const dz = pp[i3 + 2] - camZ;
      if (Math.abs(dz) < 80) {
        const pushStrength = (1 - Math.abs(dz) / 80) * 2;
        const dx = pp[i3];
        const dy = pp[i3 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        pp[i3] += (dx / dist) * pushStrength;
        pp[i3 + 1] += (dy / dist) * pushStrength;
      }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Gentle global rotation on particle system
    particleSystem.rotation.y = time * 0.015;
    particleSystem.rotation.x = Math.sin(time * 0.01) * 0.03;

    // Zen figure layered animation
    if (zenFigure && zenFigurePositions && zenFigureOriginal) {
      const breathe = Math.sin(time * 0.6) * 0.012;
      const types = zenFigure.userData.pointTypes;
      const count = zenFigure.userData.pointCount;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ox = zenFigureOriginal[i3], oy = zenFigureOriginal[i3+1], oz = zenFigureOriginal[i3+2];
        const type = types[i];
        const phase = i * 0.37;

        if (type <= 1) {
          // Core + edge: gentle breathing + micro float
          zenFigurePositions[i3] = ox * (1 + breathe) + Math.sin(time * 0.4 + phase) * 0.3;
          zenFigurePositions[i3+1] = oy * (1 + breathe) + Math.cos(time * 0.35 + phase) * 0.3;
          zenFigurePositions[i3+2] = oz + Math.sin(time * 0.25 + phase) * 0.4;
        } else if (type === 2) {
          // Aura: slow orbit around body
          const drift = Math.sin(time * 0.3 + phase) * 3;
          const pulse = Math.sin(time * 0.5 + phase) * 2;
          zenFigurePositions[i3] = ox + drift;
          zenFigurePositions[i3+1] = oy + pulse;
          zenFigurePositions[i3+2] = oz + Math.cos(time * 0.2 + phase) * 3;
        } else {
          // Trail: continuous upward drift with reset
          const speed = 8 + (i % 7) * 2;
          const cycle = ((time * speed + phase * 50) % 200) / 200; // 0-1 repeating
          zenFigurePositions[i3] = ox + Math.sin(time * 0.3 + phase) * (3 + cycle * 8);
          zenFigurePositions[i3+1] = oy + cycle * 60; // drift upward
          zenFigurePositions[i3+2] = oz + Math.cos(time * 0.4 + phase) * (2 + cycle * 5);
        }
      }
      zenFigure.geometry.attributes.position.needsUpdate = true;
      zenFigure.rotation.y = Math.sin(time * 0.12) * 0.12;
    }

    // Icosahedron orbits
    const orbitRadius = 250;
    icosahedron.position.x = Math.cos(time * 0.3) * orbitRadius;
    icosahedron.position.y = Math.sin(time * 0.2) * 80;
    icosahedron.position.z = Math.sin(time * 0.3) * orbitRadius - 100;
    icosahedron.rotation.x = time * 0.4;
    icosahedron.rotation.y = time * 0.6;

    // Connection lines - throttled
    if (frameCount % 3 === 0) {
      updateConnections();
    }

    renderer.render(scene, camera);
  }

  // --- Boot ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // --- Public API ---
  window.zenScene = {
    setScrollProgress: setScrollProgress,
  };
})();
