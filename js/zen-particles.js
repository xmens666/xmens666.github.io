// Zen Meditation Figure - 3D Particle Point Cloud
(function () {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'zen-canvas';
    canvas.style.cssText = 'position:absolute;top:0;right:0;width:50%;height:100%;z-index:2;pointer-events:none;';
    hero.style.position = 'relative';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // Skip zen particles on mobile — saves CPU, barely visible at 0.25 opacity
        canvas.remove();
        return;
    }

    let W, H, particles = [], disperseAmount = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Create glow texture
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 32;
    glowCanvas.height = 32;
    const gc = glowCanvas.getContext('2d');
    const grad = gc.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    gc.fillStyle = grad;
    gc.fillRect(0, 0, 32, 32);

    function resize() {
        const rect = hero.getBoundingClientRect();
        W = rect.width * (isMobile ? 1 : 0.5);
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildFigure();
    }

    function buildFigure() {
        particles = [];

        const cx = W / 2;
        const cy = H * 0.45;
        const scale = Math.min(W, H) * 0.0032;
        const step = isMobile ? 4 : 2.5;

        // Draw refined meditation silhouette on offscreen canvas
        const oc = document.createElement('canvas');
        oc.width = W;
        oc.height = H;
        const o = oc.getContext('2d');
        o.fillStyle = '#fff';

        const s = scale;

        // Head - perfect circle
        o.beginPath();
        o.arc(cx, cy - 80 * s, 18 * s, 0, Math.PI * 2);
        o.fill();

        // Neck
        o.beginPath();
        o.moveTo(cx - 5 * s, cy - 63 * s);
        o.lineTo(cx + 5 * s, cy - 63 * s);
        o.lineTo(cx + 7 * s, cy - 52 * s);
        o.lineTo(cx - 7 * s, cy - 52 * s);
        o.closePath();
        o.fill();

        // Shoulders + torso (smooth trapezoid)
        o.beginPath();
        o.moveTo(cx - 40 * s, cy - 48 * s);
        o.quadraticCurveTo(cx - 44 * s, cy - 20 * s, cx - 35 * s, cy + 5 * s);
        o.quadraticCurveTo(cx - 25 * s, cy + 20 * s, cx, cy + 25 * s);
        o.quadraticCurveTo(cx + 25 * s, cy + 20 * s, cx + 35 * s, cy + 5 * s);
        o.quadraticCurveTo(cx + 44 * s, cy - 20 * s, cx + 40 * s, cy - 48 * s);
        o.closePath();
        o.fill();

        // Left arm
        o.beginPath();
        o.moveTo(cx - 38 * s, cy - 42 * s);
        o.quadraticCurveTo(cx - 55 * s, cy - 15 * s, cx - 48 * s, cy + 15 * s);
        o.quadraticCurveTo(cx - 40 * s, cy + 28 * s, cx - 15 * s, cy + 18 * s);
        o.lineTo(cx - 18 * s, cy + 10 * s);
        o.quadraticCurveTo(cx - 38 * s, cy + 18 * s, cx - 40 * s, cy + 8 * s);
        o.quadraticCurveTo(cx - 46 * s, cy - 12 * s, cx - 30 * s, cy - 38 * s);
        o.closePath();
        o.fill();

        // Right arm
        o.beginPath();
        o.moveTo(cx + 38 * s, cy - 42 * s);
        o.quadraticCurveTo(cx + 55 * s, cy - 15 * s, cx + 48 * s, cy + 15 * s);
        o.quadraticCurveTo(cx + 40 * s, cy + 28 * s, cx + 15 * s, cy + 18 * s);
        o.lineTo(cx + 18 * s, cy + 10 * s);
        o.quadraticCurveTo(cx + 38 * s, cy + 18 * s, cx + 40 * s, cy + 8 * s);
        o.quadraticCurveTo(cx + 46 * s, cy - 12 * s, cx + 30 * s, cy - 38 * s);
        o.closePath();
        o.fill();

        // Hands in lap (mudra)
        o.beginPath();
        o.ellipse(cx, cy + 15 * s, 14 * s, 8 * s, 0, 0, Math.PI * 2);
        o.fill();

        // Crossed legs - left
        o.beginPath();
        o.ellipse(cx - 12 * s, cy + 42 * s, 38 * s, 14 * s, -0.15, 0, Math.PI * 2);
        o.fill();

        // Crossed legs - right
        o.beginPath();
        o.ellipse(cx + 12 * s, cy + 42 * s, 38 * s, 14 * s, 0.15, 0, Math.PI * 2);
        o.fill();

        // Feet
        o.beginPath();
        o.ellipse(cx - 30 * s, cy + 48 * s, 12 * s, 7 * s, 0.3, 0, Math.PI * 2);
        o.fill();
        o.beginPath();
        o.ellipse(cx + 30 * s, cy + 48 * s, 12 * s, 7 * s, -0.3, 0, Math.PI * 2);
        o.fill();

        // Sample points
        const imgData = o.getImageData(0, 0, W, H);
        for (let y = 0; y < H; y += step) {
            for (let x = 0; x < W; x += step) {
                const idx = (Math.floor(y) * W + Math.floor(x)) * 4;
                if (imgData.data[idx + 3] > 128) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
                    const speed = 120 + Math.random() * 350;

                    // Simulate Z depth for 3D feel
                    const z = (Math.random() - 0.5) * 40;
                    const depthScale = 1 + z * 0.008;

                    // Color: mostly green, some brighter, some gold
                    const rnd = Math.random();
                    let r, g, b;
                    if (rnd < 0.6) {
                        // Green
                        r = 0; g = 180 + Math.random() * 75; b = 100 + Math.random() * 63;
                    } else if (rnd < 0.85) {
                        // Bright green
                        r = 0; g = 255; b = 163;
                    } else if (rnd < 0.95) {
                        // Gold
                        r = 184; g = 151; b = 106;
                    } else {
                        // White
                        r = 200; g = 220; b = 210;
                    }

                    particles.push({
                        ox: x, oy: y,
                        x: x, y: y, z: z,
                        dx: Math.cos(angle) * speed,
                        dy: Math.sin(angle) * speed,
                        dz: (Math.random() - 0.5) * 200,
                        r: r, g: g, b: b,
                        size: (1.2 + Math.random() * 1.8) * depthScale,
                        alpha: (0.5 + Math.random() * 0.5) * depthScale,
                        phase: Math.random() * Math.PI * 2,
                        floatSpeed: 0.3 + Math.random() * 1.2,
                        delay: dist / (Math.min(W, H) * 0.8),
                    });
                }
            }
        }
    }

    let time = 0;
    function render() {
        time += 0.016;
        ctx.clearRect(0, 0, W, H);

        const cx = W / 2, cy = H * 0.45;

        // Aura glow when assembled
        if (disperseAmount < 0.4) {
            const glowA = (1 - disperseAmount / 0.4) * 0.12;
            const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.35);
            rg.addColorStop(0, `rgba(0, 255, 163, ${glowA * 0.8})`);
            rg.addColorStop(0.5, `rgba(0, 255, 163, ${glowA * 0.3})`);
            rg.addColorStop(1, 'transparent');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, H);

            // Inner bright core
            const rg2 = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, Math.min(W, H) * 0.12);
            rg2.addColorStop(0, `rgba(0, 255, 163, ${glowA * 0.5})`);
            rg2.addColorStop(1, 'transparent');
            ctx.fillStyle = rg2;
            ctx.fillRect(0, 0, W, H);
        }

        // Draw particles as glowing dots
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            const ed = Math.max(0, Math.min(1,
                (disperseAmount - p.delay * 0.25) / Math.max(0.01, 1 - p.delay * 0.25)
            ));

            // Floating when assembled
            const fx = Math.sin(time * p.floatSpeed + p.phase) * 1.5 * (1 - ed);
            const fy = Math.cos(time * p.floatSpeed * 0.8 + p.phase) * 1.5 * (1 - ed);

            p.x = p.ox + fx + p.dx * ed * ed; // quadratic easing
            p.y = p.oy + fy + p.dy * ed * ed;
            const zOffset = p.dz * ed;
            const zScale = 1 + (p.z + zOffset) * 0.005;

            const alpha = p.alpha * (1 - ed * 0.85);
            if (alpha < 0.02) continue;

            const size = p.size * Math.max(0.3, zScale);

            // Draw glowing dot
            ctx.globalAlpha = alpha;
            ctx.drawImage(glowCanvas, p.x - size * 2, p.y - size * 2, size * 4, size * 4);

            // Bright center point
            ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
            ctx.globalAlpha = alpha * 0.9;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // Energy lines connecting nearby particles (when assembled)
        if (disperseAmount < 0.3 && !isMobile) {
            const lineAlpha = (1 - disperseAmount / 0.3) * 0.06;
            ctx.strokeStyle = `rgba(0, 255, 163, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            const sampleStep = 8;
            for (let i = 0; i < particles.length; i += sampleStep) {
                const a = particles[i];
                for (let j = i + sampleStep; j < particles.length; j += sampleStep) {
                    const b = particles[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < 900) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
        }

        requestAnimationFrame(render);
    }

    function initScroll() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(initScroll, 100);
            return;
        }
        gsap.to({ v: 0 }, {
            v: 1, ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
                onUpdate: self => { disperseAmount = self.progress; }
            }
        });
    }

    resize();
    render();
    initScroll();
    window.addEventListener('resize', resize);
})();
