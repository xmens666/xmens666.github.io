document.addEventListener('DOMContentLoaded', () => {
    // Meteor Effect Script
    (function () {
        const containers = document.querySelectorAll('.meteors-container');
        const number = 20; // Number of meteors

        containers.forEach(container => {
            for (let i = 0; i < number; i++) {
                const span = document.createElement('span');
                span.className = 'meteor-effect';

                // Random properties
                const left = Math.floor(Math.random() * (400 - -80) + -80) + 'px';
                const delay = (Math.random() * (0.8 - 0.2) + 0.2).toFixed(2) + 's';
                const duration = Math.floor(Math.random() * (10 - 2) + 2) + 's';

                span.style.left = left;
                span.style.animationDelay = delay;
                span.style.animationDuration = duration;
                span.style.top = -5 + 'px'; // Start slightly above

                container.appendChild(span);
            }
        });
    })();

    // Spotlight Effect Script
    (function () {
        const cards = document.querySelectorAll('.spotlight-card');
        const container = document.getElementById('bento-grid');

        if (container) {
            container.onmousemove = e => {
                for (const card of cards) {
                    const rect = card.getBoundingClientRect(),
                        x = e.clientX - rect.left,
                        y = e.clientY - rect.top;

                    card.style.setProperty("--x", `${x}px`);
                    card.style.setProperty("--y", `${y}px`);
                }
            };
        }
    })();

    // Mobile: Auto-activate hover effects on scroll into view
    (function () {
        // Only apply on touch devices
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!isTouchDevice) return;

        const cards = document.querySelectorAll('.audience-card-wrapper');

        if (!cards.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -10% 0px', // Trigger when card is 10% into viewport
            threshold: 0.3 // 30% of card visible
        };

        let currentActiveCard = null;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = entry.target;

                if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                    // Deactivate previous card
                    if (currentActiveCard && currentActiveCard !== card) {
                        currentActiveCard.classList.remove('touch-active');
                    }
                    // Activate current card
                    card.classList.add('touch-active');
                    currentActiveCard = card;
                } else if (!entry.isIntersecting) {
                    card.classList.remove('touch-active');
                    if (currentActiveCard === card) {
                        currentActiveCard = null;
                    }
                }
            });
        }, observerOptions);

        cards.forEach(card => observer.observe(card));
    })();
});
