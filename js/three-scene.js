/**
 * Three.js 3D Background Scene for zencode.jp
 * Replaces particles.js with a full 3D immersive space environment
 */
(function () {
  'use strict';

  // --- Config ---
  const isMobile = window.innerWidth <= 768;
  const PARTICLE_COUNT = isMobile ? 600 : 1500;
  const CONNECTION_DISTANCE = isMobile ? 80 : 120;
  const CONNECTION_MAX = isMobile ? 300 : 800;
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
  let torusKnot, icosahedron;

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

    const spread = 1200;
    const depthSpread = 1500;
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

      sizes[i] = Math.random() * 4 + 1.5;
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
          gl_FragColor = vec4(vColor, texColor.a * 0.85);
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

  // --- Wireframe shapes ---
  function createWireframes() {
    // Torus Knot - large, central
    const torusGeo = new THREE.TorusKnotGeometry(120, 30, 80, 12, 2, 3);
    const torusMat = new THREE.MeshBasicMaterial({
      color: COLORS.green,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    torusKnot = new THREE.Mesh(torusGeo, torusMat);
    torusKnot.position.set(0, 0, -200);
    scene.add(torusKnot);

    // Icosahedron - orbiting
    const icoGeo = new THREE.IcosahedronGeometry(40, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: COLORS.gold,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
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
      opacity: 0.35,
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

    // Wireframe animations
    torusKnot.rotation.x = time * 0.08;
    torusKnot.rotation.y = time * 0.12;
    torusKnot.rotation.z = time * 0.05;
    // Subtle breathing scale
    const breathe = 1 + Math.sin(time * 0.5) * 0.03;
    torusKnot.scale.setScalar(breathe);

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
