(function () {
    // Ported Simplex Noise Implementation (Self-contained)
    const createNoise3D = () => {
        var F3 = 1.0 / 3.0;
        var G3 = 1.0 / 6.0;
        var P = new Uint8Array([151, 160, 137, 91, 90, 15,
            131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
            190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
            88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
            77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
            102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
            135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
            5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
            223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
            251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
            49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
            138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180]);

        var perm = new Uint8Array(512);
        var permMod12 = new Uint8Array(512);
        for (var i = 0; i < 512; i++) {
            perm[i] = P[i & 255];
            permMod12[i] = perm[i] % 12;
        }

        var grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];

        function dot(g, x, y, z) {
            return g[0] * x + g[1] * y + g[2] * z;
        }

        return function (x, y, z) {
            var n0, n1, n2, n3;
            var s = (x + y + z) * F3;
            var i = Math.floor(x + s);
            var j = Math.floor(y + s);
            var k = Math.floor(z + s);
            var t = (i + j + k) * G3;
            var X0 = i - t;
            var Y0 = j - t;
            var Z0 = k - t;
            var x0 = x - X0;
            var y0 = y - Y0;
            var z0 = z - Z0;
            var i1, j1, k1;
            var i2, j2, k2;
            if (x0 >= y0) {
                if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
                else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
                else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
            }
            else {
                if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
                else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
                else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            }
            var x1 = x0 - i1 + G3;
            var y1 = y0 - j1 + G3;
            var z1 = z0 - k1 + G3;
            var x2 = x0 - i2 + 2.0 * G3;
            var y2 = y0 - j2 + 2.0 * G3;
            var z2 = z0 - k2 + 2.0 * G3;
            var x3 = x0 - 1.0 + 3.0 * G3;
            var y3 = y0 - 1.0 + 3.0 * G3;
            var z3 = z0 - 1.0 + 3.0 * G3;
            var ii = i & 255;
            var jj = j & 255;
            var kk = k & 255;
            var gi0 = permMod12[ii + perm[jj + perm[kk]]];
            var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
            var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
            var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
            var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if (t0 < 0) n0 = 0.0;
            else { t0 *= t0; n0 = t0 * t0 * dot(grad3[gi0], x0, y0, z0); }
            var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if (t1 < 0) n1 = 0.0;
            else { t1 *= t1; n1 = t1 * t1 * dot(grad3[gi1], x1, y1, z1); }
            var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if (t2 < 0) n2 = 0.0;
            else { t2 *= t2; n2 = t2 * t2 * dot(grad3[gi2], x2, y2, z2); }
            var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if (t3 < 0) n3 = 0.0;
            else { t3 *= t3; n3 = t3 * t3 * dot(grad3[gi3], x3, y3, z3); }
            return 32.0 * (n0 + n1 + n2 + n3);
        };
    };

    const noise3D = createNoise3D();

    function startVortex() {
        const canvas = document.getElementById('vortexCanvas');
        if (!canvas) {
            // Retry if canvas is not yet available
            requestAnimationFrame(startVortex);
            return;
        }

        const ctx = canvas.getContext('2d');
        let width, height;

        // Configuration
        const particleCount = 700;
        const particlePropCount = 9;
        const particlePropsLength = particleCount * particlePropCount;
        const rangeY = 100;
        const baseTTL = 50;
        const rangeTTL = 150;
        const baseSpeed = 0.0;
        const rangeSpeed = 1.5;
        const baseRadius = 1;
        const rangeRadius = 2;
        const baseHue = 220;
        const rangeHue = 100;
        const noiseSteps = 3;
        const xOff = 0.00125;
        const yOff = 0.00125;
        const zOff = 0.0005;
        const backgroundColor = "#000000";

        let particleProps;
        let center = [0, 0];
        let tick = 0;

        // Use TypedArray for performance
        particleProps = new Float32Array(particlePropsLength);

        const rand = (n) => n * Math.random();
        const randRange = (n) => n - rand(2 * n);
        const fadeInOut = (t, m) => {
            let hm = 0.5 * m;
            return Math.abs((t + hm) % m - hm) / (hm);
        };
        const lerp = (n1, n2, speed) => (1 - speed) * n1 + speed * n2;

        function resize() {
            // Robustly get dimensions
            width = window.innerWidth;
            height = window.innerHeight;

            // Or try to use parent if valid
            if (canvas.parentElement && canvas.parentElement.clientWidth > 0) {
                width = canvas.parentElement.clientWidth;
                height = canvas.parentElement.clientHeight;
            }

            canvas.width = width;
            canvas.height = height;
            center = [0.5 * width, 0.5 * height];
        }

        function initParticle(i) {
            let x, y, vx, vy, life, ttl, speed, radius, hue;
            x = rand(width || window.innerWidth);
            y = center[1] + randRange(rangeY);
            vx = 0; vy = 0; life = 0;
            ttl = baseTTL + rand(rangeTTL);
            speed = baseSpeed + rand(rangeSpeed);
            radius = baseRadius + rand(rangeRadius);
            hue = baseHue + rand(rangeHue);
            particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
        }

        function initParticles() {
            tick = 0;
            for (let i = 0; i < particlePropsLength; i += particlePropCount) {
                initParticle(i);
            }
        }

        function updateParticle(i) {
            let i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i;
            let n, x, y, vx, vy, life, ttl, speed, x2, y2, radius, hue;

            x = particleProps[i];
            y = particleProps[i2];
            n = noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * Math.PI * 2;
            vx = lerp(particleProps[i3], Math.cos(n), 0.5);
            vy = lerp(particleProps[i4], Math.sin(n), 0.5);
            life = particleProps[i5];
            ttl = particleProps[i6];
            speed = particleProps[i7];
            x2 = x + vx * speed;
            y2 = y + vy * speed;
            radius = particleProps[i8];
            hue = particleProps[i9];

            drawParticle(x, y, x2, y2, life, ttl, radius, hue);

            life++;

            particleProps[i] = x2;
            particleProps[i2] = y2;
            particleProps[i3] = vx;
            particleProps[i4] = vy;
            particleProps[i5] = life;

            (checkBounds(x, y) || life > ttl) && initParticle(i);
        }

        function drawParticle(x, y, x2, y2, life, ttl, radius, hue) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = radius;
            ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        }

        function checkBounds(x, y) {
            return (x > width || x < 0 || y > height || y < 0);
        }

        function animate() {
            // Check if we need to resize (e.g. became visible)
            if (canvas.width === 0 || canvas.height === 0) {
                resize();
                // If success, re-init particles
                if (canvas.width > 0) initParticles();
            }

            tick++;

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < particlePropsLength; i += particlePropCount) {
                updateParticle(i);
            }

            requestAnimationFrame(animate);
        }

        // Init
        resize();
        initParticles();
        animate();

        // Event Listeners
        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });

        // Listen to custom event for forcing resize/init
        document.addEventListener('slideChange', (e) => {
            if (e.detail.slideIndex === 1) { // Vortex Slide
                setTimeout(() => {
                    resize();
                    // Do not re-init particles to keep flow continuity, 
                    // unless they are messed up (width was 0)
                    if (width > 0 && particleProps[0] === 0 && particleProps[1] === 0) {
                        initParticles();
                    }
                }, 50);
            }
        });
    }

    // Attach to DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startVortex);
    } else {
        startVortex(); // Already loaded
    }
})();
