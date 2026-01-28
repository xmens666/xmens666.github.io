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

});
