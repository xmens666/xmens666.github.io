// GSAP ScrollTrigger animations for ZenCode.jp
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    // Hero section - staggered entrance
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
        .from('.hero-badge', { y: 30, opacity: 0, duration: 0.8 })
        .from('.hero h1', { y: 50, opacity: 0, duration: 1 }, '-=0.4')
        .from('.hero-desc', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hero-actions', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
        .from('.hero-stack-item', {
            y: 40, opacity: 0, duration: 0.6,
            stagger: 0.12
        }, '-=0.3');

    // Services section
    gsap.from('.section-label', {
        scrollTrigger: { trigger: '.section-label', start: 'top 85%' },
        y: 20, opacity: 0, duration: 0.6
    });

    gsap.from('.service-card', {
        scrollTrigger: { trigger: '.services-grid', start: 'top 80%' },
        y: 60, opacity: 0, duration: 0.8,
        stagger: 0.15, ease: 'power3.out'
    });

    // Cases / Work section
    gsap.from('.work-card', {
        scrollTrigger: { trigger: '.work-grid', start: 'top 80%' },
        y: 80, opacity: 0, duration: 0.9,
        stagger: 0.2, ease: 'power3.out'
    });

    // Process steps
    gsap.from('.process-step', {
        scrollTrigger: { trigger: '.process-steps', start: 'top 80%' },
        y: 50, opacity: 0, scale: 0.95, duration: 0.7,
        stagger: 0.15, ease: 'back.out(1.4)'
    });

    // Process connecting line - animate via CSS custom property
    // (pseudo-elements can't be targeted directly by GSAP)

    // Tech strip logos
    gsap.from('.tech-item', {
        scrollTrigger: { trigger: '.tech-strip', start: 'top 85%' },
        y: 30, opacity: 0, duration: 0.5,
        stagger: 0.08, ease: 'power2.out'
    });

    // Trust strip counters with number animation
    const trustNumbers = document.querySelectorAll('.trust-grid > div');
    trustNumbers.forEach(item => {
        gsap.from(item, {
            scrollTrigger: { trigger: '.trust-strip', start: 'top 85%' },
            y: 40, opacity: 0, duration: 0.7,
            stagger: 0.1, ease: 'power3.out'
        });
    });

    // CTA section
    gsap.from('.cta-section h2', {
        scrollTrigger: { trigger: '.cta-section', start: 'top 85%' },
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
    });
    gsap.from('.cta-section p', {
        scrollTrigger: { trigger: '.cta-section', start: 'top 85%' },
        y: 30, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out'
    });
    gsap.from('.cta-section .btn-primary', {
        scrollTrigger: { trigger: '.cta-section', start: 'top 85%' },
        y: 20, opacity: 0, duration: 0.6, delay: 0.4, ease: 'power3.out'
    });

    // Footer
    gsap.from('.footer-col', {
        scrollTrigger: { trigger: '.site-footer', start: 'top 90%' },
        y: 40, opacity: 0, duration: 0.8,
        stagger: 0.2, ease: 'power3.out'
    });

    // Nav logo subtle entrance
    gsap.from('.nav-logo', { x: -20, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power2.out' });
    gsap.from('.nav-links a', { y: -10, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.4, ease: 'power2.out' });
    gsap.from('.nav-cta', { scale: 0.9, opacity: 0, duration: 0.5, delay: 0.8, ease: 'back.out(1.7)' });

    // Magnetic hover effect on service cards
    document.querySelectorAll('.service-card, .work-card, .process-step').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, { scale: 1.02, duration: 0.3, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { scale: 1, duration: 0.3, ease: 'power2.out' });
        });
    });

    // Section titles - reveal with clip path
    document.querySelectorAll('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: { trigger: title, start: 'top 85%' },
            clipPath: 'inset(0 100% 0 0)',
            opacity: 0, duration: 1, ease: 'power4.out'
        });
    });

    // Section descriptions
    document.querySelectorAll('.section-desc').forEach(desc => {
        gsap.from(desc, {
            scrollTrigger: { trigger: desc, start: 'top 85%' },
            y: 20, opacity: 0, duration: 0.7, delay: 0.3, ease: 'power3.out'
        });
    });

    // Smooth fade out hero on scroll
    gsap.to('.hero-inner', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '60% top',
            scrub: 1
        },
        y: -80, opacity: 0.3
    });
});
