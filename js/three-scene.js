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

  // --- Zen meditation figure (true 3D particle cloud) ---
  function createZenFigure() {
    var points = [], pointTypes = []; // 0=body, 1=surface, 2=aura, 3=trail

    // 3D body part primitives: {type, center[x,y,z], radii[rx,ry,rz], count}
    var sc = isMobile ? 0.9 : 1.1;
    var bodyParts = [
      // Head (dense, key feature)
      { c:[0,88,0], r:[13,16,13], n:800, surface:0.5 },
      // Neck
      { c:[0,73,0], r:[6,5,6], n:150, surface:0.3 },
      // Upper torso / chest
      { c:[0,58,1], r:[26,16,14], n:1200, surface:0.4 },
      // Lower torso / belly
      { c:[0,40,2], r:[22,12,12], n:600, surface:0.35 },
      // Left shoulder
      { c:[-30,65,0], r:[9,7,8], n:250, surface:0.4 },
      // Right shoulder
      { c:[30,65,0], r:[9,7,8], n:250, surface:0.4 },
      // Left upper arm
      { c:[-36,52,4], r:[6,14,6], n:300, surface:0.35 },
      // Left forearm (angled toward lap)
      { c:[-26,34,10], r:[5,12,5], n:250, surface:0.35 },
      // Right upper arm
      { c:[36,52,4], r:[6,14,6], n:300, surface:0.35 },
      // Right forearm
      { c:[26,34,10], r:[5,12,5], n:250, surface:0.35 },
      // Left hand (in lap, mudra)
      { c:[-8,25,12], r:[6,4,5], n:200, surface:0.5 },
      // Right hand
      { c:[8,25,12], r:[6,4,5], n:200, surface:0.5 },
      // Left thigh (lotus, angled out)
      { c:[-18,18,5], r:[24,7,9], n:500, surface:0.35 },
      // Right thigh
      { c:[18,18,5], r:[24,7,9], n:500, surface:0.35 },
      // Left shin/calf (folded under)
      { c:[20,12,8], r:[14,5,6], n:250, surface:0.35 },
      // Right shin/calf
      { c:[-14,10,9], r:[14,5,6], n:250, surface:0.35 },
      // Left foot
      { c:[30,8,6], r:[8,4,5], n:120, surface:0.4 },
      // Right foot
      { c:[-24,6,7], r:[8,4,5], n:120, surface:0.4 },
    ];

    // Sample particles inside each 3D ellipsoid
    bodyParts.forEach(function(part) {
      var cx = part.c[0]*sc, cy = part.c[1]*sc, cz = part.c[2]*sc;
      var rx = part.r[0]*sc, ry = part.r[1]*sc, rz = part.r[2]*sc;
      var count = isMobile ? Math.floor(part.n * 0.6) : part.n;
      var surfaceRatio = part.surface;

      for (var i = 0; i < count; i++) {
        var px, py, pz, dist;
        // Rejection sampling inside ellipsoid
        do {
          px = (Math.random() * 2 - 1);
          py = (Math.random() * 2 - 1);
          pz = (Math.random() * 2 - 1);
          dist = px*px + py*py + pz*pz;
        } while (dist > 1);

        // Bias toward surface for that glowing edge look
        var r = Math.sqrt(dist);
        if (Math.random() < surfaceRatio) {
          // Push to near-surface (0.85-1.0 of radius)
          var targetR = 0.85 + Math.random() * 0.15;
          if (r > 0.001) { px *= targetR/r; py *= targetR/r; pz *= targetR/r; }
          r = targetR;
          pointTypes.push(1); // surface
        } else {
          pointTypes.push(0); // interior
        }

        points.push(cx + px * rx, cy + py * ry, cz + pz * rz);
      }
    });

    // Aura particles (floating around body)
    var auraCount = isMobile ? 300 : 600;
    for (var i = 0; i < auraCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var elevation = Math.random() * Math.PI - Math.PI * 0.3;
      var dist = (50 + Math.random() * 40) * sc;
      var ay = 45 * sc + Math.sin(elevation) * dist;
      var ax = Math.cos(angle) * Math.cos(elevation) * dist;
      var az = Math.sin(angle) * Math.cos(elevation) * dist * 0.6;
      points.push(ax, ay, az);
      pointTypes.push(2);
    }

    // Energy trail (upward from head/crown)
    var trailCount = isMobile ? 200 : 400;
    for (var i = 0; i < trailCount; i++) {
      var t = Math.random();
      var spread = t * 25 * sc;
      var tx = (Math.random() - 0.5) * spread;
      var ty = (90 + t * 80) * sc; // upward from head
      var tz = (Math.random() - 0.5) * spread * 0.5;
      points.push(tx, ty, tz);
      pointTypes.push(3);
    }

    // Ground glow (beneath sitting figure)
    var groundCount = isMobile ? 200 : 350;
    for (var i = 0; i < groundCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = Math.random() * 55 * sc;
      var gx = Math.cos(angle) * dist;
      var gy = (Math.random() - 0.5) * 3 * sc;
      var gz = Math.sin(angle) * dist * 0.5;
      points.push(gx, gy, gz);
      pointTypes.push(2);
    }

    // Build geometry
    var count = points.length / 3;
    var positions = new Float32Array(points);
    var original = new Float32Array(points);
    var colors = new Float32Array(count * 3);
    var sizes = new Float32Array(count);
    var color = new THREE.Color();

    for (var i = 0; i < count; i++) {
      var type = pointTypes[i];
      var rnd = Math.random();

      if (type === 1) {
        // Surface: bright, sharp — defines the silhouette
        if (rnd < 0.5) color.setHex(COLORS.green);
        else if (rnd < 0.75) color.setHex(COLORS.white);
        else if (rnd < 0.9) color.setHex(0x80ffd0);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 1.8 + rnd * 1.5 : 1.5 + rnd * 2;
      } else if (type === 0) {
        // Interior: dimmer, creates volume
        if (rnd < 0.4) color.setHex(0x00aa6e);
        else if (rnd < 0.7) color.setHex(COLORS.darkGreen);
        else color.setHex(0x00cc80);
        sizes[i] = isMobile ? 1.0 + rnd * 0.8 : 0.8 + rnd * 1.2;
      } else if (type === 2) {
        // Aura/ground: soft glow
        if (rnd < 0.5) color.setHex(COLORS.green);
        else if (rnd < 0.8) color.setHex(0x00cc80);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 3.5 + rnd * 4 : 3 + rnd * 5;
      } else {
        // Trail: bright ascending
        if (rnd < 0.35) color.setHex(COLORS.white);
        else if (rnd < 0.65) color.setHex(COLORS.green);
        else if (rnd < 0.85) color.setHex(0x80ffd0);
        else color.setHex(COLORS.gold);
        sizes[i] = isMobile ? 1.2 + rnd * 2.5 : 1 + rnd * 3.5;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    var glowTexture = createGlowTexture();
    var material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: glowTexture },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: [
        'attribute float size;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'uniform float uPixelRatio;',
        'void main() {',
        '  vColor = color;',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  float dist = length(mvPosition.xyz);',
        '  vAlpha = clamp(1.0 - dist / 800.0, 0.3, 1.0);',
        '  gl_PointSize = size * uPixelRatio * (350.0 / -mvPosition.z);',
        '  gl_PointSize = clamp(gl_PointSize, 0.5, 45.0);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTexture;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'void main() {',
        '  vec4 texColor = texture2D(uTexture, gl_PointCoord);',
        '  gl_FragColor = vec4(vColor, texColor.a * vAlpha * 0.95);',
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
    zenFigure.userData.pointTypes = pointTypes;
    zenFigure.userData.pointCount = count;
    // Position: right side on desktop, center on mobile
    zenFigure.position.set(isMobile ? 0 : 180, isMobile ? -40 : -45, isMobile ? 100 : -30);
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

    // Zen figure 3D animation
    if (zenFigure && zenFigurePositions && zenFigureOriginal) {
      var breathe = Math.sin(time * 0.5) * 0.008;
      var types = zenFigure.userData.pointTypes;
      var cnt = zenFigure.userData.pointCount;

      for (var i = 0; i < cnt; i++) {
        var i3 = i * 3;
        var ox = zenFigureOriginal[i3], oy = zenFigureOriginal[i3+1], oz = zenFigureOriginal[i3+2];
        var type = types[i];
        var phase = i * 0.23;

        if (type <= 1) {
          // Body particles: breathing + subtle float
          var b = breathe * (1 + oy * 0.005); // more movement at top
          zenFigurePositions[i3] = ox * (1 + b) + Math.sin(time * 0.3 + phase) * 0.2;
          zenFigurePositions[i3+1] = oy * (1 + b * 0.5) + Math.cos(time * 0.25 + phase) * 0.15;
          zenFigurePositions[i3+2] = oz * (1 + b) + Math.sin(time * 0.2 + phase) * 0.2;
        } else if (type === 2) {
          // Aura/ground: gentle orbit
          zenFigurePositions[i3] = ox + Math.sin(time * 0.2 + phase) * 2.5;
          zenFigurePositions[i3+1] = oy + Math.sin(time * 0.35 + phase) * 1.5;
          zenFigurePositions[i3+2] = oz + Math.cos(time * 0.15 + phase) * 2;
        } else {
          // Trail: rise upward, cycle and reset
          var speed = 5 + (i % 5) * 2;
          var cycle = ((time * speed + phase * 40) % 180) / 180;
          zenFigurePositions[i3] = ox + Math.sin(time * 0.2 + phase) * (2 + cycle * 12);
          zenFigurePositions[i3+1] = oy + cycle * 50;
          zenFigurePositions[i3+2] = oz + Math.cos(time * 0.25 + phase) * (1.5 + cycle * 8);
        }
      }
      zenFigure.geometry.attributes.position.needsUpdate = true;
      // Slow continuous rotation for 3D reveal
      zenFigure.rotation.y = time * 0.06;
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
