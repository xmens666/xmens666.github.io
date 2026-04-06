/**
 * Three.js 3D Zen Meditation Particle Cloud
 * Pixel-sampling from real reference image → 3D particle mapping
 * GLSL shaders + UnrealBloomPass + GSAP scroll camera zoom
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
  const BG_PARTICLE_COUNT = isMobile ? 400 : 900;
  const CONNECTION_DISTANCE = isMobile ? 100 : 120;
  const CONNECTION_MAX = isMobile ? 200 : 450;
  const COLORS = {
    cyan: 0x00e5ff,
    deepBlue: 0x0a192f,
    starlight: 0xffffff,
    purple: 0xb388ff,
    warmStar: 0xffaa00
  };
  const COLOR_ARRAY = [COLORS.cyan, COLORS.starlight, COLORS.purple, COLORS.warmStar];
  const COLOR_WEIGHTS = [0.5, 0.3, 0.15, 0.05];

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

  // =========================================================
  // 1. SILHOUETTE MASKING (from image)
  // =========================================================
  function loadImageAndSample() {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        const maxW = isMobile ? 180 : 250;
        const scale = maxW / img.width;
        const W = Math.floor(img.width * scale);
        const H = Math.floor(img.height * scale);

        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, W, H);

        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;
        const points = [];

        const cx = W / 2;
        const cy = H / 2; // Figure is centered
        const step = isMobile ? 5 : 4; // Dramatically reduced particle count

        for (let y = 0; y < H; y += step) {
          for (let x = 0; x < W; x += step) {
            const idx = (y * W + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
            
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;

            // MASK: Skip the black background of the JPG or transparent pixels
            if (a < 128 || brightness < 15) continue;

            const mapScale = isMobile ? 0.7 : 1.1;
            const px = (x - cx) * mapScale;
            const py = -(y - cy) * mapScale; // WebGL Y grows UP

            // --- Construct a Faux-3D Volume out of the 2D Image ---
            // 1. Normalized horizontal distance from center [0 = center, 1 = edge]
            const nx = Math.min(Math.abs(x - cx) / (W * 0.45), 1.0); 
            // 2. Normalized vertical distance from center [-1 = top head, +1 = bottom legs]
            const ny = Math.max(-1.0, Math.min((y - cy) / (H * 0.45), 1.0));

            // 3. Base thickness: thick in the middle, tapers smoothly to the edges using a Cosine curve
            let thickness = Math.cos(nx * Math.PI * 0.5) * 45.0; // Base torso thickness
            let zOffset = 0;

            if (ny > 0.3) {
              // Bottom half (crossed legs): heavily protruding forward + thicker bounds
              const legFactor = (ny - 0.3) / 0.7; // 0 to 1
              thickness += legFactor * 35.0;
              zOffset = legFactor * 40.0; // Push knees physically forward
            } else if (ny < -0.4) {
              // Top area (head): cleanly spherical
              thickness = Math.cos(nx * Math.PI * 0.5) * 35.0;
            }

            // Scatter Z randomly within the calculated volumetric thickness range
            const pz = ((Math.random() - 0.5) * thickness + zOffset) * mapScale;

            points.push({ x: px, y: py, z: pz, brightness: brightness / 255.0 });
          }
        }
        resolve(points);
      };
      img.onerror = function () {
        console.error("Failed to load image");
        resolve(null);
      };
      img.src = 'img/zen-monk2.jpg';
    });
  }

  // =========================================================
  // 2. CREATE ZEN FIGURE (Points Geometry)
  // =========================================================
  function createZenFigure(samplePoints) {
    if (!samplePoints || samplePoints.length === 0) return;

    const bodyCount = samplePoints.length;

    // Extra particles for atmosphere (fine dust for rings)
    const ringCount = isMobile ? 800 : 1800;
    const totalCount = bodyCount + ringCount;

    const positions = new Float32Array(totalCount * 3);
    const alphas = new Float32Array(totalCount);
    const original = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    const pointTypes = new Int8Array(totalCount);

    const color = new THREE.Color();

    // Fill body (the glowing silhouette mapped from image array)
    for (let i = 0; i < bodyCount; i++) {
      const p = samplePoints[i];
      const i3 = i * 3;

      positions[i3] = p.x;
      positions[i3 + 1] = p.y + 10; // Slightly nudge up
      positions[i3 + 2] = p.z;
      
      original[i3] = positions[i3];
      original[i3 + 1] = positions[i3 + 1];
      original[i3 + 2] = positions[i3 + 2];
      
      alphas[i] = 0.8 + Math.random() * 0.2;

      // Magical cosmic colors linked to original image brightness!
      const rand = Math.random();
      
      // Extremely bright spots in the photo become pure starlight
      if (p.brightness > 0.8 || rand < 0.02) {
        color.setHex(COLORS.starlight);
        sizes[i] = isMobile ? 3.0 : 3.5;
        alphas[i] = 1.0;
      } else if (rand < 0.12) {
        color.setHex(Math.random() > 0.5 ? COLORS.warmStar : COLORS.cyan);
        sizes[i] = isMobile ? 2.5 : 3.0;
        alphas[i] = 0.9;
      } else if (p.brightness > 0.4 || rand < 0.75) {
        // Mid-tones map to our core cyan vibe
        color.setHex(COLORS.cyan);
        color.lerp(new THREE.Color(COLORS.deepBlue), Math.random() * 0.3);
        sizes[i] = isMobile ? 2.2 : 2.5;
      } else {
        // Darker folds and edges become deep blue/purple shadow lines
        color.setHex(COLORS.purple);
        color.lerp(new THREE.Color(COLORS.deepBlue), Math.random() * 0.3);
        sizes[i] = isMobile ? 1.8 : 2.2;
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      pointTypes[i] = 0;
    }

    // --- Swirling Galaxy Rings ---
    let idx = bodyCount;
    for (let i = 0; i < ringCount; i++, idx++) {
      // 3 spiral arms
      const armIndex = i % 3;
      const t = Math.random(); // position along the arm
      
      const angle = t * Math.PI * 10 + (armIndex * Math.PI * 2 / 3); 
      const radius = 25 + t * 300 + (Math.random() - 0.5) * 40;
      
      // Slant the ring using Math.sin
      const elevation = Math.sin(angle * 1.5) * 40 + (Math.random() - 0.5) * 30;

      const i3 = idx * 3;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = elevation - 50; 
      positions[i3 + 2] = Math.sin(angle) * radius * 0.6; // slightly elliptical
      
      original[i3] = positions[i3];
      original[i3 + 1] = positions[i3 + 1];
      original[i3 + 2] = positions[i3 + 2];
      
      alphas[idx] = 0.4 + Math.random() * 0.3; // Ensure background rings are visible
      pointTypes[idx] = armIndex === 0 ? 3 : 4; 
      
      const rnd = Math.random();
      if (rnd < 0.15) color.setHex(COLORS.starlight);
      else if (rnd < 0.6) color.setHex(COLORS.cyan);
      else if (rnd < 0.85) color.setHex(COLORS.purple);
      else color.setHex(COLORS.deepBlue);
      
      colors[i3] = color.r; colors[i3 + 1] = color.g; colors[i3 + 2] = color.b;
      sizes[idx] = Math.random() * (isMobile ? 2.0 : 2.5) + 0.5; // Fine cosmic dust for rings
    }

    // --- Geometry ---
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // --- GLSL Shader Material ---
    const glowTexture = createGlowTexture();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: glowTexture },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uTime: { value: 0 },
        uExpansion: { value: 0.0 },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;
        uniform float uTime;
        uniform float uExpansion;

        float hash(vec3 p) {
          p = fract(p * vec3(443.8975, 397.2973, 491.1871));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }

        void main() {
          vColor = color;
          vec3 pos = position;

          // Scroll-driven expansion
          pos *= 1.0 + uExpansion * 0.18;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float dist = length(mvPosition.xyz);
          vAlpha = alpha * clamp(1.0 - dist / 1400.0, 0.3, 1.0);

          gl_PointSize = size * uPixelRatio * (400.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 55.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          float a = texColor.a * vAlpha;
          if (a < 0.01) discard;
          // Restore beautiful blooming brightness
          gl_FragColor = vec4(vColor * (1.1 + texColor.r * 1.5), a);
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
    zenFigure.userData.bodyCount = bodyCount;

    zenFigure.position.set(
      isMobile ? 0 : 180,
      isMobile ? -10 : -20,
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




  // --- Init ---
  function init() {
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
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.0;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0006);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 0, 500);

    // Post-processing: bloom
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      isMobile ? 1.2 : 1.4,   // Softer strength to prevent shape fusion
      0.4,                     // Crisper radius
      0.1                      // Lower threshold to ensure body blooms softly
    );
    composer.addPass(bloomPass);

    // Build scene elements
    createBgParticles();
    // Load Image and mask out particles
    loadImageAndSample().then((pointsArray) => {
      createZenFigure(pointsArray);
    });

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

    // Camera zoom — scroll drives you INTO the particle cloud
    camera.rotation.y = mouseX * 0.05;
    camera.rotation.x = mouseY * 0.03;
    camera.position.z = 500 - scrollProgress * 800;

    // Dynamic bloom intensity on scroll
    if (bloomPass) {
      bloomPass.strength = (isMobile ? 1.0 : 1.2) + scrollProgress * 0.4;
    }

    // --- Background particles ---
    const bSpread = 600, bDepth = 750;
    const pp = bgPositions, pv = bgVelocities;
    const camZ = camera.position.z;

    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pp[i3] += pv[i3];
      pp[i3 + 1] += pv[i3 + 1];
      pp[i3 + 2] += pv[i3 + 2];

      if (pp[i3] > bSpread) pp[i3] = -bSpread;
      else if (pp[i3] < -bSpread) pp[i3] = bSpread;
      if (pp[i3 + 1] > bSpread) pp[i3 + 1] = -bSpread;
      else if (pp[i3 + 1] < -bSpread) pp[i3 + 1] = bSpread;
      if (pp[i3 + 2] > bDepth) pp[i3 + 2] = -bDepth;
      else if (pp[i3 + 2] < -bDepth) pp[i3 + 2] = bDepth;

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
      
      // Deep meditative breathing: ~6 seconds per breath cycle
      const breathe = Math.sin(time * 1.0) * 0.015;

      zenFigure.material.uniforms.uTime.value = time;
      zenFigure.material.uniforms.uExpansion.value = scrollProgress;

      for (let i = 0; i < totalCount; i++) {
        const i3 = i * 3;
        const ox = zenOriginal[i3], oy = zenOriginal[i3 + 1], oz = zenOriginal[i3 + 2];
        const type = zenPointTypes[i];
        const phase = i * 0.23;

        if (type <= 1) {
          // Body/mid from image: gently breathe only, NO jitter/shaking
          const b = breathe * (1 + oy * 0.003);
          positions[i3] = ox * (1 + b);
          positions[i3 + 1] = oy * (1 + b * 0.5);
          positions[i3 + 2] = oz * (1 + b);
        } else if (type === 2) {
          // Faint outer: no jitter
          positions[i3] = ox;
          positions[i3 + 1] = oy;
          positions[i3 + 2] = oz;
        } else if (type === 3 || type === 4) {
          // Spiral Arms: Rotate them over time!
          const rSpeed = (type === 3 ? 0.25 : 0.15);
          const angleOffset = time * rSpeed;
          
          // Original XY flat rotation
          const cosA = Math.cos(angleOffset);
          const sinA = Math.sin(angleOffset);
          
          // Breathe / floating
          const floatY = Math.sin(time * 0.5 + phase) * 2.0;

          // Note: ox, oz are the original flat plane coords, oy is elevation
          positions[i3] = ox * cosA - oz * sinA;
          positions[i3 + 1] = oy + floatY;
          positions[i3 + 2] = ox * sinA + oz * cosA;
        }
      }
      zenFigure.geometry.attributes.position.needsUpdate = true;
      // Fixed orientation: No rotation, just calm breathing
      zenFigure.rotation.y = 0; 
    }

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
