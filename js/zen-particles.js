// Zen Meditation Figure - Code Particle Dispersion
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'zen-canvas';
    canvas.style.cssText = `
        position: absolute; top: 0; right: 0; width: 50%; height: 100%;
        z-index: 2; pointer-events: none;
    `;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    hero.style.position = 'relative';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const codeChars = '01{}()<>[];:=/\\+-*&|!?#@$%^~_.,"\'`abcdefABCDEF0123456789function()return{const}if(true)while(i++)for(let)=>import'.split('');

    let W, H, particles = [], disperseAmount = 0, mouseX = 0.5, mouseY = 0.5;
    const isMobile = window.innerWidth <= 768;

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        W = rect.width * (isMobile ? 1 : 0.5);
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = (isMobile ? '100%' : '50%');
        canvas.style.height = '100%';
        if (isMobile) {
            canvas.style.left = '0';
            canvas.style.opacity = '0.3';
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildParticles();
    }

    // Draw meditation silhouette on offscreen canvas, then sample points
    function buildParticles() {
        particles = [];
        const offscreen = document.createElement('canvas');
        const oc = offscreen.getContext('2d');
        const size = Math.min(W, H) * 0.7;
        offscreen.width = W;
        offscreen.height = H;

        const cx = W / 2;
        const cy = H / 2;
        const s = size / 200; // scale factor

        oc.fillStyle = '#fff';
        oc.beginPath();

        // Head
        oc.arc(cx, cy - 72 * s, 22 * s, 0, Math.PI * 2);
        oc.fill();

        // Neck
        oc.fillRect(cx - 6 * s, cy - 52 * s, 12 * s, 12 * s);

        // Body / torso
        oc.beginPath();
        oc.moveTo(cx - 45 * s, cy - 40 * s);
        oc.quadraticCurveTo(cx - 50 * s, cy + 10 * s, cx - 30 * s, cy + 30 * s);
        oc.lineTo(cx + 30 * s, cy + 30 * s);
        oc.quadraticCurveTo(cx + 50 * s, cy + 10 * s, cx + 45 * s, cy - 40 * s);
        oc.closePath();
        oc.fill();

        // Crossed legs
        oc.beginPath();
        oc.ellipse(cx, cy + 45 * s, 55 * s, 20 * s, 0, 0, Math.PI * 2);
        oc.fill();

        oc.beginPath();
        oc.ellipse(cx - 15 * s, cy + 55 * s, 40 * s, 15 * s, -0.2, 0, Math.PI * 2);
        oc.fill();

        oc.beginPath();
        oc.ellipse(cx + 15 * s, cy + 55 * s, 40 * s, 15 * s, 0.2, 0, Math.PI * 2);
        oc.fill();

        // Arms resting on knees
        // Left arm
        oc.beginPath();
        oc.moveTo(cx - 42 * s, cy - 30 * s);
        oc.quadraticCurveTo(cx - 60 * s, cy + 5 * s, cx - 45 * s, cy + 35 * s);
        oc.lineTo(cx - 35 * s, cy + 35 * s);
        oc.quadraticCurveTo(cx - 48 * s, cy + 5 * s, cx - 32 * s, cy - 25 * s);
        oc.closePath();
        oc.fill();

        // Right arm
        oc.beginPath();
        oc.moveTo(cx + 42 * s, cy - 30 * s);
        oc.quadraticCurveTo(cx + 60 * s, cy + 5 * s, cx + 45 * s, cy + 35 * s);
        oc.lineTo(cx + 35 * s, cy + 35 * s);
        oc.quadraticCurveTo(cx + 48 * s, cy + 5 * s, cx + 32 * s, cy - 25 * s);
        oc.closePath();
        oc.fill();

        // Hands in lap (mudra)
        oc.beginPath();
        oc.ellipse(cx, cy + 20 * s, 18 * s, 10 * s, 0, 0, Math.PI * 2);
        oc.fill();

        // Sample points from silhouette
        const imageData = oc.getImageData(0, 0, W, H);
        const step = isMobile ? 8 : 5;
        const fontSize = isMobile ? 8 : 10;

        for (let y = 0; y < H; y += step) {
            for (let x = 0; x < W; x += step) {
                const idx = (y * W + x) * 4;
                if (imageData.data[idx + 3] > 128) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
                    const speed = 150 + Math.random() * 300;

                    particles.push({
                        x: x, y: y,
                        ox: x, oy: y,         // original position
                        dx: Math.cos(angle) * speed,  // disperse direction
                        dy: Math.sin(angle) * speed,
                        char: codeChars[Math.floor(Math.random() * codeChars.length)],
                        size: fontSize + Math.random() * 3,
                        alpha: 0.4 + Math.random() * 0.6,
                        // Color: green spectrum with some gold
                        color: Math.random() > 0.85
                            ? `rgba(184, 151, 106, VAL)`  // gold
                            : `rgba(0, ${155 + Math.floor(Math.random() * 100)}, ${80 + Math.floor(Math.random() * 80)}, VAL)`,
                        phase: Math.random() * Math.PI * 2,  // for subtle float
                        floatSpeed: 0.5 + Math.random() * 1.5,
                        rotSpeed: (Math.random() - 0.5) * 0.02,
                        rot: 0,
                        delay: dist / (size * 2),  // dispersion delay based on distance from center
                    });
                }
            }
        }
    }

    let time = 0;
    function render() {
        time += 0.016;
        ctx.clearRect(0, 0, W, H);

        // Glow behind figure when assembled
        if (disperseAmount < 0.3) {
            const glowAlpha = (1 - disperseAmount / 0.3) * 0.15;
            const cx = W / 2, cy = H / 2;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
            grad.addColorStop(0, `rgba(0, 255, 163, ${glowAlpha})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Calculate effective dispersion for this particle (with delay)
            const effectiveDisperse = Math.max(0, Math.min(1,
                (disperseAmount - p.delay * 0.3) / (1 - p.delay * 0.3)
            ));

            // Floating animation when assembled
            const floatX = Math.sin(time * p.floatSpeed + p.phase) * 2 * (1 - effectiveDisperse);
            const floatY = Math.cos(time * p.floatSpeed * 0.7 + p.phase) * 2 * (1 - effectiveDisperse);

            // Position: lerp between original and dispersed
            p.x = p.ox + floatX + p.dx * effectiveDisperse;
            p.y = p.oy + floatY + p.dy * effectiveDisperse;

            // Rotation increases with dispersion
            p.rot += p.rotSpeed * effectiveDisperse;

            // Alpha: fade out as dispersing
            const alpha = p.alpha * (1 - effectiveDisperse * 0.7);
            if (alpha < 0.01) continue;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * effectiveDisperse * 5);

            const colorStr = p.color.replace('VAL', alpha.toFixed(2));
            ctx.fillStyle = colorStr;
            ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
            ctx.fillText(p.char, 0, 0);
            ctx.restore();
        }

        // Scan line effect (subtle)
        if (disperseAmount < 0.5) {
            const scanY = (time * 60) % H;
            ctx.strokeStyle = `rgba(0, 255, 163, ${0.06 * (1 - disperseAmount * 2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, scanY);
            ctx.lineTo(W, scanY);
            ctx.stroke();
        }

        requestAnimationFrame(render);
    }

    // ScrollTrigger: control disperseAmount from 0 to 1
    function initScroll() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(initScroll, 100);
            return;
        }

        gsap.to({ val: 0 }, {
            val: 1, ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
                onUpdate: function (self) {
                    disperseAmount = self.progress;
                }
            }
        });
    }

    // Mouse interaction: subtle particle attraction on hero
    if (!isMobile) {
        hero.addEventListener('mousemove', e => {
            const rect = hero.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) / rect.width;
            mouseY = (e.clientY - rect.top) / rect.height;
        });
    }

    resize();
    render();
    initScroll();
    window.addEventListener('resize', () => { resize(); });
})();
