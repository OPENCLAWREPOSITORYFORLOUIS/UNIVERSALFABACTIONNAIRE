/**
 * main.js - Universal Fab 
 * Optimized lightweight script (replaces 1.45MB legacy bundle)
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Universal Fab Optimized Loading...');

    // 1. Splash Screen Animation
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        tl.to('#splash-title', { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power2.out' });
        tl.to('#splash-presente', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "-=0.3");
        tl.to('#lariya-simple-splash', { 
            opacity: 0, 
            duration: 1, 
            delay: 1.5, 
            pointerEvents: 'none', 
            onComplete: () => {
                const el = document.getElementById('lariya-simple-splash');
                if(el) el.remove();
            }
        });
    } else {
        // Fallback: remove splash after 3s if GSAP fails
        setTimeout(() => {
            const el = document.getElementById('lariya-simple-splash');
            if(el) el.remove();
        }, 3000);
    }

    // 2. Theme Toggle (Light/Dark)
    const switchBtn = document.querySelector('.home-switch');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }

    // 3. Restore saved theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
    }

    // 4. Hero Video Lazy Load / Optimization
    const video = document.querySelector('.home__content__video video');
    if (video) {
        video.play().catch(() => {
            console.log('Autoplay blocked, waiting for interaction');
        });
    }

    // 5. Custom Cursor (Optional but requested before)
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: "power2.out"
            });
        });
    }
});
