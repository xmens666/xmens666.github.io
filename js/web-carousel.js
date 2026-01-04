(() => {
    const { useState, useEffect } = React;

    const WebCarousel = () => {
        const [activeIndex, setActiveIndex] = useState(0);
        const images = [
            "img/web_1.png",
            "img/web_2.png",
            "img/web_3.png"
        ];

        useEffect(() => {
            const interval = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % images.length);
            }, 4000);
            return () => clearInterval(interval);
        }, []);

        return (
            <div className="relative w-full h-full flex items-center justify-center perspective-1000">
                {images.map((img, index) => {
                    // Calculate relative position based on activeIndex
                    const length = images.length;
                    let offset = (index - activeIndex + length) % length;

                    let style = {};
                    let className = "absolute transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] w-[90%] md:w-[85%] aspect-[16/10] rounded-xl shadow-2xl overflow-hidden border border-white/20 bg-neutral-900";

                    if (index === activeIndex) {
                        style = {
                            zIndex: 20,
                            transform: "translateX(0) scale(1) translateZ(0)",
                            opacity: 1,
                            filter: "brightness(110%)"
                        };
                    } else if (index === (activeIndex + 1) % length) {
                        // Next Slide
                        style = {
                            zIndex: 10,
                            transform: "translateX(100px) scale(0.85) translateZ(-100px) rotateY(-10deg)",
                            opacity: 0.6,
                            filter: "brightness(70%) blur(1px)"
                        };
                    } else {
                        // Prev Slide
                        style = {
                            zIndex: 10,
                            transform: "translateX(-100px) scale(0.85) translateZ(-100px) rotateY(10deg)",
                            opacity: 0.6,
                            filter: "brightness(70%) blur(1px)"
                        };
                    }

                    return (
                        <div key={index} className={className} style={style}>
                            <div className="absolute top-0 left-0 w-full h-6 bg-neutral-800 flex items-center px-4 space-x-2 border-b border-white/10 z-20">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            <img src={img} alt="Showcase" className="mt-6 w-full h-[calc(100%-1.5rem)] object-cover object-top" />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const root = ReactDOM.createRoot(document.getElementById('hero-parallax-root'));
    root.render(<WebCarousel />);
})();
