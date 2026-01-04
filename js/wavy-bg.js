
(function () {
    const canvas = document.getElementById('wavyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h;
    let animationId;
    let nt = 0; // noise time

    // Simplified Simplex Noise implementation
    // Using a fast lightweight Implementation
    const SimplexNoise = (function () {
        function SimplexNoise() {
            this.perm = new Uint8Array(512);
            var p = new Uint8Array(256);
            for (let i = 0; i < 256; i++) p[i] = i;
            for (let i = 0; i < 256; i++) { // Shuffle
                let r = (Math.random() * 256) | 0;
                let t = p[i]; p[i] = p[r]; p[r] = t;
            }
            for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
            this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
        }
        SimplexNoise.prototype.dot = function (g, x, y) { return g[0] * x + g[1] * y; }
        SimplexNoise.prototype.noise = function (xin, yin) {
            var n0, n1, n2;
            var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
            var s = (xin + yin) * F2;
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
            var t = (i + j) * G2;
            var X0 = i - t;
            var Y0 = j - t;
            var x0 = xin - X0;
            var y0 = yin - Y0;
            var i1, j1;
            if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
            var x1 = x0 - i1 + G2;
            var y1 = y0 - j1 + G2;
            var x2 = x0 - 1.0 + 2.0 * G2;
            var y2 = y0 - 1.0 + 2.0 * G2;
            var ii = i & 255;
            var jj = j & 255;
            var gi0 = this.perm[ii + this.perm[jj]] % 12;
            var gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
            var gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
            var t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); }
            var t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); }
            var t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); }
            return 70.0 * (n0 + n1 + n2);
        };
        return SimplexNoise;
    })();

    const noise = new SimplexNoise();

    // Aceternity Wavy Background Config
    const waveColors = [
        "#38bdf8",
        "#818cf8",
        "#c084fc",
        "#e879f9",
        "#22d3ee",
    ];
    // Exact mimic of Aceternity default props
    const waveWidth = 50;
    const backgroundFill = "black";
    const blur = 10;
    const speed = "slow"; // fast = 0.002, slow = 0.001
    const waveOpacity = 0.5;

    // Derived values
    const speedValue = speed === "fast" ? 0.002 : 0.001;

    function resize() {
        w = ctx.canvas.parentElement.clientWidth;
        h = ctx.canvas.parentElement.clientHeight;
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        ctx.filter = `blur(${blur}px)`;
    }

    function render() {
        ctx.fillStyle = backgroundFill;
        ctx.globalAlpha = waveOpacity || 0.5;
        ctx.fillRect(0, 0, w, h);

        nt += speedValue;

        drawWave(5);
        animationId = requestAnimationFrame(render);
    }

    const drawWave = (n) => {
        nt += speedValue;
        for (let i = 0; i < n; i++) {
            ctx.beginPath();
            ctx.lineWidth = waveWidth || 50;
            ctx.strokeStyle = waveColors[i % waveColors.length];
            for (let x = 0; x < w; x += 5) {
                var y = noise.noise(x / 800, 0.3 * i + nt) * 100;
                ctx.lineTo(x, y + h * 0.5);
            }
            ctx.stroke();
            ctx.closePath();
        }
    };

    function init() {
        resize();
        render(); // Aceternity renders continuously
    }

    // Attach Listeners
    window.addEventListener('resize', resize);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Fix for slider switch
    document.addEventListener('slideChange', (e) => {
        if (e.detail.slideIndex === 2) {
            // Force a tiny logical delay to ensure dimensions are correct
            setTimeout(() => {
                resize();
            }, 50);
        }
    });

})();
