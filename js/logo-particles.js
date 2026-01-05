(function () {
    const canvas = document.getElementById('canvas1');
    if (!canvas) return; // Guard clause

    const ctx = canvas.getContext('2d');
    const loading = document.getElementById('loading');

    // 设置 Canvas 尺寸
    // 注意：这里我们让 Canvas 填满它的父容器，而不是全屏
    function setCanvasSize() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }
    setCanvasSize();

    let particlesArray = [];
    const image = new Image();
    image.src = 'logo.png'; // ⚠️ 确保 logo.png 在同级目录

    // Logo 缩放比例 (根据 Canvas 大小动态调整)
    let scale = 0.6;
    if (canvas.width < 500) scale = 0.4; // 手机端缩小

    class Particle {
        constructor(x, y, color) {
            this.originX = x;
            this.originY = y;
            // 初始位置随机
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.color = color;
            this.size = 1.5; // 粒子大小
            this.vx = 0;
            this.vy = 0;
            this.friction = 0.90;
            this.ease = 0.08;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }

        update() {
            this.x += (this.originX - this.x) * this.ease;
            this.y += (this.originY - this.y) * this.ease;
        }

        warp(mouseX, mouseY) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = dx * dx + dy * dy;
            if (distance < 20000) {
                const angle = Math.atan2(dy, dx);
                const force = -2000 / distance;
                this.x += Math.cos(angle) * force * 20;
                this.y += Math.sin(angle) * force * 20;
            }
        }
    }

    function init() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        const imgWidth = image.width * scale;
        const imgHeight = image.height * scale;

        // 居中计算
        const offsetX = (canvas.width - imgWidth) / 2;
        const offsetY = (canvas.height - imgHeight) / 2;

        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(image, offsetX, offsetY, imgWidth, imgHeight);

        try {
            const pixels = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            if (loading) loading.style.display = 'none';

            const gap = 3; // 粒子密度，数字越小粒子越多（但越卡）

            particlesArray = []; // 清空旧粒子

            for (let y = 0; y < canvas.height; y += gap) {
                for (let x = 0; x < canvas.width; x += gap) {
                    const index = (y * canvas.width + x) * 4;
                    const red = pixels.data[index];
                    const green = pixels.data[index + 1];
                    const blue = pixels.data[index + 2];
                    const alpha = pixels.data[index + 3];

                    if (alpha > 128 && (red + green + blue) < 750) {
                        const color = `rgb(${red},${green},${blue})`;
                        particlesArray.push(new Particle(x, y, color));
                    }
                }
            }
        } catch (e) {
            if (loading) loading.innerText = "Error: Use Local Server";
            console.error(e);
        }
    }

    let isPlaying = true; // Default true as it's the first slide

    function animate() {
        if (!isPlaying) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(particle => {
            particle.draw();
            particle.update();
        });
        requestAnimationFrame(animate);
    }

    // 交互：监听整个 Hero Section 的鼠标移动
    const heroSection = canvas.closest('section');
    if (heroSection) {
        // 鼠标移动事件
        heroSection.addEventListener('mousemove', function (event) {
            if (!isPlaying) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            particlesArray.forEach(particle => {
                particle.warp(x, y);
            });
        });

        // 触屏移动事件 (手机端)
        heroSection.addEventListener('touchmove', function (event) {
            if (!isPlaying) return;

            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            particlesArray.forEach(particle => {
                particle.warp(x, y);
            });
        }, { passive: true });

        // 触屏点击事件 (单点触碰也有效果)
        heroSection.addEventListener('touchstart', function (event) {
            if (!isPlaying) return;

            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            particlesArray.forEach(particle => {
                particle.warp(x, y);
            });
        }, { passive: true });
    }

    // Listen for Slide Changes to Pause/Resume
    document.addEventListener('slideChange', (e) => {
        if (e.detail.slideIndex === 0) {
            if (!isPlaying) {
                isPlaying = true;
                animate();
            }
        } else {
            isPlaying = false;
        }
    });


    image.onload = () => {
        init();
        animate();
    };

    window.addEventListener('resize', function () {
        setCanvasSize();
        if (particlesArray.length > 0) init();
    });

})();
