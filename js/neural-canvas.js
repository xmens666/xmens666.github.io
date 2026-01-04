(function () {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    // Adaptive particle count based on screen size
    const particleCount = window.innerWidth < 768 ? 30 : 60;
    const connectionDistance = 150;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    }

    function animate() {
        // Performance Optimization: Stop loop if not hidden
        if (!isPlaying) return;

        // Check if canvas is still in DOM to prevent memory leaks if removed (though standard here)
        if (!document.getElementById('neuralCanvas')) return;

        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connectionDistance) {
                    ctx.strokeStyle = `rgba(100, 150, 255, ${0.2 * (1 - dist / connectionDistance)})`;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    let isPlaying = false;

    // Listen to Global Slide Change
    document.addEventListener('slideChange', (e) => {
        if (e.detail.slideIndex === 1) {
            if (!isPlaying) {
                isPlaying = true;
                init();
                animate();
            }
        } else {
            isPlaying = false;
        }
    });

    // Initial check (since it's not the first slide, it starts paused, 
    // BUT checking window init state might be good if we change order)
    // Default start paused as slide 0 is active first
    // init(); 
    // animate();
})();
