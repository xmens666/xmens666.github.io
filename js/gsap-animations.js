// Cinematic GSAP Animation System for ZenCode.jp
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.innerWidth <= 768;
    // Mobile: trigger earlier so content appears without empty gaps
    const triggerStart = isMobile ? 'top bottom' : 'top 88%';
    const mobileY = isMobile ? 20 : undefined; // smaller offset on mobile

    // ========== WORD SPLIT for hero h1 ==========
    const heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
        const spans = heroH1.querySelectorAll('span[x-show]');
        spans.forEach(span => {
            const inner = span.innerHTML;
            // Wrap each word (non-whitespace sequence), skip HTML tags
            const wrapped = inner.replace(/(<[^>]+>)|([^<\s]+)/g, (match, tag, word) => {
                if (tag) return tag;
                return `<span class="char-reveal">${word}</span>`;
            });
            span.innerHTML = wrapped;
        });
    }

    // ========== LOADING SCREEN ==========
    const loadingScreen = document.querySelector('.loading-screen');
    let loadingDismissed = false;

    function dismissLoading() {
        if (loadingDismissed) return;
        loadingDismissed = true;
        if (loadingScreen) {
            gsap.to(loadingScreen, {
                opacity: 0, duration: 0.6, ease: 'power2.inOut',
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    playHeroEntrance();
                }
            });
        } else {
            playHeroEntrance();
        }
    }

    if (loadingScreen) {
        // Dismiss on window load + short delay, OR force after 3s max
        window.addEventListener('load', () => setTimeout(dismissLoading, 800));
        setTimeout(dismissLoading, 3000); // failsafe
    } else {
        playHeroEntrance();
    }

    // ========== SCROLL-LINKED THREE.JS BACKGROUND ==========
    ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
            if (window.zenScene && window.zenScene.setScrollProgress) {
                window.zenScene.setScrollProgress(self.progress);
            }
        }
    });

    // ========== HERO ENTRANCE (cinematic timeline) ==========
    function playHeroEntrance() {
        const d = isMobile ? 0.6 : 1; // duration multiplier for mobile
        const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

        heroTl
            .from('.hero-badge', {
                scale: 0, opacity: 0, duration: 0.4 * d,
                ease: 'back.out(2)'
            })
            .from('.char-reveal', {
                y: isMobile ? 30 : 80, opacity: 0,
                rotateX: isMobile ? 0 : -90,
                duration: 0.5 * d, stagger: isMobile ? 0.05 : 0.08,
                ease: 'power4.out'
            }, '-=0.1')
            .from('.hero-desc', {
                y: isMobile ? 15 : 40, opacity: 0,
                duration: 0.5 * d,
                filter: isMobile ? 'none' : 'blur(10px)'
            }, '-=0.2')
            .from('.hero-stack-item', {
                y: isMobile ? 15 : 60, opacity: 0,
                duration: 0.3 * d,
                stagger: { each: isMobile ? 0.05 : 0.1, from: 'start' }
            }, '-=0.2');

        // Create hero scroll parallax AFTER loading screen is gone
        if (!isMobile) {
            gsap.to('.hero-inner', {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: '80% top',
                    scrub: 1
                },
                y: -120, opacity: 0, scale: 0.95
            });
        }

    }


    // ========== HERO SCROLL PARALLAX (desktop only, deferred) ==========
    // Created after loading screen dismissal to avoid layout-shift miscalc

    // ========== NAV ENTRANCE ==========
    gsap.from('.nav-logo', {
        x: -30, opacity: 0, duration: 0.8,
        delay: 0.3, ease: 'power3.out'
    });
    gsap.from('.nav-links a', {
        y: -15, opacity: 0, duration: 0.4,
        stagger: 0.06, delay: 0.5, ease: 'power2.out'
    });
    gsap.from('.nav-cta', {
        scale: 0.8, opacity: 0, duration: 0.5,
        delay: 0.9, ease: 'back.out(2)'
    });

    // ========== SECTION TITLES - clip path reveal ==========
    document.querySelectorAll('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: { trigger: title, start: triggerStart, once: true },
            clipPath: isMobile ? 'none' : 'inset(0 100% 0 0)',
            opacity: 0, y: mobileY || 0, duration: isMobile ? 0.6 : 1.2,
            ease: isMobile ? 'power3.out' : 'power4.inOut'
        });
    });

    // ========== SECTION LABELS - slide from left ==========
    document.querySelectorAll('.section-label').forEach(label => {
        gsap.from(label, {
            scrollTrigger: { trigger: label, start: triggerStart, once: true },
            x: isMobile ? -15 : -30, opacity: 0, duration: 0.5
        });
    });

    // ========== SECTION DESCRIPTIONS - fade up ==========
    document.querySelectorAll('.section-desc').forEach(desc => {
        gsap.from(desc, {
            scrollTrigger: { trigger: desc, start: triggerStart, once: true },
            y: mobileY || 20, opacity: 0, duration: 0.6, delay: 0.1
        });
    });

    // ========== SERVICE CARDS - stagger with 3D rotateY ==========
    gsap.from('.service-card', {
        scrollTrigger: { trigger: '.services-grid', start: triggerStart, once: true },
        y: isMobile ? 30 : 80, opacity: 0, rotateY: isMobile ? 0 : 15,
        duration: isMobile ? 0.5 : 0.9, stagger: isMobile ? 0.08 : 0.12, ease: 'power3.out',
    });

    // ========== WORK CARDS - fade in sequentially ==========
    gsap.from('.work-card', {
        scrollTrigger: { trigger: '.work-grid', start: triggerStart, once: true },
        opacity: 0,
        y: 10,
        duration: 1.4,
        stagger: 0.15,
        ease: 'power1.out',
    });

    // ========== PROCESS STEPS - bounce in ==========
    gsap.from('.process-step', {
        scrollTrigger: { trigger: '.process-steps', start: triggerStart, once: true },
        y: isMobile ? 25 : 60, opacity: 0, scale: isMobile ? 0.9 : 0.8,
        duration: isMobile ? 0.5 : 0.8, stagger: isMobile ? 0.08 : 0.12,
        ease: 'back.out(1.7)'
    });

    // Step numbers spin in
    gsap.from('.step-num', {
        scrollTrigger: { trigger: '.process-steps', start: triggerStart, once: true },
        rotation: isMobile ? 180 : 360, scale: 0,
        duration: isMobile ? 0.5 : 0.8, stagger: isMobile ? 0.08 : 0.12,
        ease: 'back.out(2)', delay: 0.1
    });

    // ========== TECH ITEMS - wave stagger with scale bounce ==========
    gsap.from('.tech-item', {
        scrollTrigger: { trigger: '.tech-strip', start: triggerStart, once: true },
        y: isMobile ? 20 : 40, opacity: 0, scale: isMobile ? 0.9 : 0.8,
        duration: 0.4, stagger: 0.04, ease: 'back.out(1.5)'
    });

    // ========== TRUST STRIP - counter animation ==========
    const trustItems = document.querySelectorAll('.trust-grid > div');
    trustItems.forEach((item, i) => {
        const numEl = item.querySelector('.trust-number');
        if (!numEl) return;
        const finalText = numEl.textContent.trim();
        const numMatch = finalText.match(/(\d+)/);

        gsap.from(item, {
            scrollTrigger: { trigger: '.trust-strip', start: triggerStart, once: true },
            y: isMobile ? 20 : 50, opacity: 0, duration: 0.5,
            delay: i * 0.08, ease: 'power3.out',
            onStart: () => {
                if (numMatch) {
                    const target = parseInt(numMatch[0]);
                    const suffix = finalText.replace(numMatch[0], '');
                    const obj = { val: 0 };
                    gsap.to(obj, {
                        val: target, duration: 1.2,
                        ease: 'power2.out',
                        onUpdate: () => {
                            numEl.textContent = Math.round(obj.val) + suffix;
                        }
                    });
                }
            }
        });
    });

    // ========== CTA SECTION - dramatic entrance ==========
    const ctaTl = gsap.timeline({
        scrollTrigger: { trigger: '.cta-section', start: triggerStart, once: true }
    });
    ctaTl
        .from('.cta-section h2', {
            y: isMobile ? 20 : 60, opacity: 0, scale: isMobile ? 1 : 0.9,
            duration: isMobile ? 0.5 : 0.8, ease: 'power3.out'
        })
        .from('.cta-section p', {
            y: isMobile ? 15 : 30, opacity: 0, duration: 0.5
        }, '-=0.3')
        .from('.cta-section .btn-primary', {
            y: 15, scale: 0.95,
            duration: 0.4, ease: 'back.out(2)'
        }, '-=0.2');

    // ========== FOOTER - fade up columns ==========
    gsap.from('.footer-col', {
        scrollTrigger: { trigger: '.site-footer', start: isMobile ? 'top bottom' : 'top 92%', once: true },
        y: isMobile ? 20 : 40, opacity: 0, duration: 0.6,
        stagger: 0.1, ease: 'power3.out'
    });

    // ========== 3D TILT ON HOVER (desktop only) ==========
    if (!isMobile) {
        document.querySelectorAll('.service-card, .work-card').forEach(card => {
            card.style.transformStyle = 'preserve-3d';
            card.style.perspective = '800px';

            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                gsap.to(card, {
                    rotateY: x * 10, rotateX: -y * 10,
                    scale: 1.03, duration: 0.4, ease: 'power2.out',
                    boxShadow: `${x * 20}px ${y * 20}px 40px rgba(0,255,163,0.15)`
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateY: 0, rotateX: 0, scale: 1,
                    duration: 0.6, ease: 'elastic.out(1, 0.5)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
                });
            });
        });

        // Magnetic hover for process steps
        document.querySelectorAll('.process-step').forEach(step => {
            step.addEventListener('mouseenter', () => {
                gsap.to(step, { scale: 1.05, y: -8, duration: 0.3, ease: 'power2.out' });
                gsap.to(step.querySelector('.step-num'), {
                    scale: 1.2, rotation: 10, duration: 0.3
                });
            });
            step.addEventListener('mouseleave', () => {
                gsap.to(step, { scale: 1, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
                gsap.to(step.querySelector('.step-num'), {
                    scale: 1, rotation: 0, duration: 0.4
                });
            });
        });
    }

    // ========== CURSOR GLOW (desktop only) ==========
    if (!isMobile) {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);
        document.addEventListener('mousemove', e => {
            gsap.to(glow, {
                x: e.clientX, y: e.clientY,
                duration: 0.6, ease: 'power2.out'
            });
        });
    }

    // ========== GLITCH EFFECT on hero title hover (desktop) ==========
    if (!isMobile) {
        const heroTitle = document.querySelector('.hero h1');
        let glitchRunning = false;
        const glitchColors = ['#00FFA3', '#00BFFF', '#FF4D6A', '#BF5FFF', '#FFD600'];
        if (heroTitle) {
            heroTitle.addEventListener('mouseenter', () => {
                if (glitchRunning) return;
                glitchRunning = true;
                const words = document.querySelectorAll('.char-reveal');
                words.forEach((word, i) => {
                    const color = glitchColors[i % glitchColors.length];
                    gsap.to(word, {
                        color: color,
                        duration: 0.15,
                        delay: i * 0.06,
                        yoyo: true, repeat: 1,
                        onComplete: i === words.length - 1 ? () => { glitchRunning = false; } : undefined
                    });
                });
            });
        }
    }
});
