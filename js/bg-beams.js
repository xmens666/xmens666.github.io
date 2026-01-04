(function () {
    const canvas = document.getElementById('beamsCanvas');
    if (!canvas) return; // Guard clause
    const ctx = canvas.getContext('2d');

    let width, height;
    let beams = [];
    const gridSpacing = 40;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class Beam {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.floor(Math.random() * (width / gridSpacing)) * gridSpacing;
            this.y = Math.random() * height;
            this.len = Math.random() * 200 + 100;
            this.speed = Math.random() * 2 + 1;
            this.opacity = 1;
            this.fading = false;
        }

        update() {
            this.y += this.speed;
            if (this.y > height + this.len) {
                this.reset();
                this.y = -this.len;
            }
        }

        draw() {
            // Create gradient for the beam (tail fades out)
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y - this.len);
            grad.addColorStop(0, `rgba(59, 130, 246, 0)`);       // Head (transparent)
            grad.addColorStop(0.5, `rgba(59, 130, 246, 0.5)`);  // Body (Blue-500)
            grad.addColorStop(1, `rgba(59, 130, 246, 0)`);       // Tail

            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y - this.len, 1, this.len);
        }
    }

    function initBeams() {
        beams = [];
        for (let i = 0; i < 30; i++) {
            beams.push(new Beam());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Vertical Lines
        for (let x = 0; x <= width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal Lines
        for (let y = 0; y <= height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 2. Draw Spotlight/Vignette effect
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)'); // Darken corners
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 3. Draw Beams
        beams.forEach(beam => {
            beam.update();
            beam.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
        initBeams();
    });

    resize();
    initBeams();
    animate();
})();
