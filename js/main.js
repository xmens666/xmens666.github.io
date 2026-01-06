/**
 * ZenCode Main JavaScript
 * 包含: Lenis平滑滚动、移动端滚动吸附、Loading Screen、轮播逻辑
 */

// ========== Alpine 轮播组件数据 ==========
function carouselData() {
    return {
        activeSlide: 0,
        slides: [0, 1, 2, 3],
        timer: null,
        touchStartX: 0,
        touchEndX: 0,
        startAutoPlay() {
            this.timer = setInterval(() => {
                this.next();
            }, 7000);
        },
        resetAutoPlay() {
            clearInterval(this.timer);
            this.startAutoPlay();
        },
        next() {
            this.activeSlide = (this.activeSlide + 1) % this.slides.length;
            this.dispatchSlideChange();
        },
        prev() {
            this.activeSlide = (this.activeSlide - 1 + this.slides.length) % this.slides.length;
            this.dispatchSlideChange();
        },
        goTo(index) {
            this.activeSlide = index;
            this.dispatchSlideChange();
            this.resetAutoPlay();
        },
        dispatchSlideChange() {
            document.dispatchEvent(new CustomEvent('slideChange', { detail: { slideIndex: this.activeSlide } }));
        },
        handleTouchStart(e) {
            this.touchStartX = e.changedTouches[0].screenX;
        },
        handleTouchEnd(e) {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        },
        handleSwipe() {
            const diff = this.touchStartX - this.touchEndX;
            const threshold = 50;
            if (diff > threshold) {
                this.next();
                this.resetAutoPlay();
            } else if (diff < -threshold) {
                this.prev();
                this.resetAutoPlay();
            }
        }
    };
}

// ========== Lenis 平滑滚动 & 移动端吸附 ==========
(function initScrollBehavior() {
    const isDesktop = window.innerWidth > 767;

    if (isDesktop) {
        // 桌面端：启用 Lenis 平滑滚动
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    } else {
        // 移动端：轮播区滑动吸附到下一区块
        let lastScrollY = window.scrollY;
        let isSnapping = false;
        let hasSnapped = false;

        window.addEventListener('scroll', () => {
            if (isSnapping) return;

            const currentScrollY = window.scrollY;
            const targetAudience = document.getElementById('target-audience');
            if (!targetAudience) return;

            const carouselBottom = targetAudience.offsetTop;
            const navHeight = 80;
            const snapPoint = carouselBottom - navHeight;

            // 回到顶部时重置吸附状态
            if (currentScrollY < 10) {
                hasSnapped = false;
            }

            // 在轮播区内，向下滚动，且未吸附过
            if (!hasSnapped &&
                currentScrollY > lastScrollY &&
                currentScrollY > 10 &&
                currentScrollY < snapPoint - 50) {

                isSnapping = true;
                hasSnapped = true;

                // 平滑滚动到吸附点
                window.scrollTo({
                    top: snapPoint,
                    behavior: 'smooth'
                });

                // 等待动画完成后解锁
                setTimeout(() => {
                    isSnapping = false;
                    lastScrollY = snapPoint;
                }, 600);

                return;
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }
})();

// ========== Loading Screen ==========
(function initLoadingScreen() {
    let vantaEffect = null;
    const isMobile = window.innerWidth <= 767;
    const hasSeenLoading = sessionStorage.getItem('zencode_loading_seen');

    document.addEventListener('DOMContentLoaded', function() {
        const loadingScreen = document.getElementById('loading-screen');

        // 如果已经看过 loading，直接跳过
        if (hasSeenLoading) {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                loadingScreen.remove();
            }
            document.dispatchEvent(new CustomEvent('loadingScreenHidden'));
            return;
        }

        // 桌面端初始化 Vanta 背景
        if (typeof VANTA !== 'undefined' && !isMobile) {
            vantaEffect = VANTA.NET({
                el: "#loading-bg",
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x00C2FF,
                backgroundColor: 0x050505,
                points: 12.00,
                maxDistance: 22.00,
                spacing: 16.00,
                showDots: true
            });
        }
    });

    // 页面加载完成后隐藏 loading
    window.addEventListener('load', function() {
        if (hasSeenLoading) return;

        sessionStorage.setItem('zencode_loading_seen', 'true');

        // 移动端显示时间短一些
        const displayTime = isMobile ? 1000 : 1500;

        setTimeout(function() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                document.dispatchEvent(new CustomEvent('loadingScreenHidden'));
                setTimeout(function() {
                    if (vantaEffect) vantaEffect.destroy();
                    loadingScreen.remove();
                }, 800);
            }
        }, displayTime);
    });
})();
