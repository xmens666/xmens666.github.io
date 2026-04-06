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
    // Draw silhouette on offscreen canvas, sample points
    const W = 256, H = 256;
    const oc = document.createElement('canvas');
    oc.width = W; oc.height = H;
    const o = oc.getContext('2d');
    o.fillStyle = '#fff';

    const cx = W / 2, cy = H * 0.45, s = 1.6;

    // Head
    o.beginPath(); o.arc(cx, cy - 80 * s, 18 * s, 0, Math.PI * 2); o.fill();
    // Neck
    o.beginPath();
    o.moveTo(cx - 5*s, cy - 63*s); o.lineTo(cx + 5*s, cy - 63*s);
    o.lineTo(cx + 7*s, cy - 52*s); o.lineTo(cx - 7*s, cy - 52*s);
    o.closePath(); o.fill();
    // Torso
    o.beginPath();
    o.moveTo(cx - 40*s, cy - 48*s);
    o.quadraticCurveTo(cx - 44*s, cy - 20*s, cx - 35*s, cy + 5*s);
    o.quadraticCurveTo(cx - 25*s, cy + 20*s, cx, cy + 25*s);
    o.quadraticCurveTo(cx + 25*s, cy + 20*s, cx + 35*s, cy + 5*s);
    o.quadraticCurveTo(cx + 44*s, cy - 20*s, cx + 40*s, cy - 48*s);
    o.closePath(); o.fill();
    // Left arm
    o.beginPath();
    o.moveTo(cx - 38*s, cy - 42*s);
    o.quadraticCurveTo(cx - 55*s, cy - 15*s, cx - 48*s, cy + 15*s);
    o.quadraticCurveTo(cx - 40*s, cy + 28*s, cx - 15*s, cy + 18*s);
    o.lineTo(cx - 18*s, cy + 10*s);
    o.quadraticCurveTo(cx - 38*s, cy + 18*s, cx - 40*s, cy + 8*s);
    o.quadraticCurveTo(cx - 46*s, cy - 12*s, cx - 30*s, cy - 38*s);
    o.closePath(); o.fill();
    // Right arm
    o.beginPath();
    o.moveTo(cx + 38*s, cy - 42*s);
    o.quadraticCurveTo(cx + 55*s, cy - 15*s, cx + 48*s, cy + 15*s);
    o.quadraticCurveTo(cx + 40*s, cy + 28*s, cx + 15*s, cy + 18*s);
    o.lineTo(cx + 18*s, cy + 10*s);
    o.quadraticCurveTo(cx + 38*s, cy + 18*s, cx + 40*s, cy + 8*s);
    o.quadraticCurveTo(cx + 46*s, cy - 12*s, cx + 30*s, cy - 38*s);
    o.closePath(); o.fill();
    // Hands (mudra)
    o.beginPath(); o.ellipse(cx, cy + 15*s, 14*s, 8*s, 0, 0, Math.PI * 2); o.fill();
    // Crossed legs
    o.beginPath(); o.ellipse(cx - 12*s, cy + 42*s, 38*s, 14*s, -0.15, 0, Math.PI * 2); o.fill();
    o.beginPath(); o.ellipse(cx + 12*s, cy + 42*s, 38*s, 14*s, 0.15, 0, Math.PI * 2); o.fill();
    // Feet
    o.beginPath(); o.ellipse(cx - 30*s, cy + 48*s, 12*s, 7*s, 0.3, 0, Math.PI * 2); o.fill();
    o.beginPath(); o.ellipse(cx + 30*s, cy + 48*s, 12*s, 7*s, -0.3, 0, Math.PI * 2); o.fill();

    // Sample points from silhouette
    const imgData = o.getImageData(0, 0, W, H);
    const step = isMobile ? 3.5 : 2.5;
    const figScale = isMobile ? 1.0 : 1.2;
    const points = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const idx = (Math.floor(y) * W + Math.floor(x)) * 4;
        if (imgData.data[idx + 3] > 128) {
          // Map 2D canvas to 3D space centered at origin, add Z depth
          const px = (x - cx) * figScale;
          const py = -(y - cy) * figScale; // flip Y
          const pz = (Math.random() - 0.5) * 30 * figScale; // depth scatter
          points.push(px, py, pz);
        }
      }
    }

    const count = points.length / 3;
    const positions = new Float32Array(points);
    const original = new Float32Array(points); // keep original for breathing
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const rnd = Math.random();
      if (rnd < 0.5) color.setHex(COLORS.green);
      else if (rnd < 0.8) color.setHex(0x00cc80); // mid green
      else if (rnd < 0.92) color.setHex(COLORS.gold);
      else color.setHex(COLORS.white);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = isMobile ? 2.5 + Math.random() * 2 : 2 + Math.random() * 2.5;
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
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 30.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    zenFigure = new THREE.Points(geometry, material);
    zenFigurePositions = positions;
    zenFigureOriginal = original;
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

    // Zen figure breathing animation
    if (zenFigure && zenFigurePositions && zenFigureOriginal) {
      const breathe = Math.sin(time * 0.8) * 0.015;
      const count = zenFigurePositions.length / 3;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ox = zenFigureOriginal[i3], oy = zenFigureOriginal[i3+1], oz = zenFigureOriginal[i3+2];
        // Gentle float + breathing expand
        zenFigurePositions[i3] = ox * (1 + breathe) + Math.sin(time * 0.5 + i * 0.1) * 0.4;
        zenFigurePositions[i3+1] = oy * (1 + breathe) + Math.cos(time * 0.4 + i * 0.15) * 0.4;
        zenFigurePositions[i3+2] = oz + Math.sin(time * 0.3 + i * 0.2) * 0.6;
      }
      zenFigure.geometry.attributes.position.needsUpdate = true;
      // Slow gentle rotation
      zenFigure.rotation.y = Math.sin(time * 0.15) * 0.15;
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
