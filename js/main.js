/**
 * main.js - Universal Fab
 * Premium GSAP animations and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initMagneticCursor();
});

/**
 * Core Animations Logic
 */
function initAnimations() {
    // 1. Text Reveal Animation (Slide up from hidden overflow)
    gsap.utils.toArray('.text-reveal span').forEach(span => {
        gsap.to(span, {
            y: 0,
            duration: 1.2,
            ease: "power4.out",
            delay: span.dataset.delay || 0,
            scrollTrigger: {
                trigger: span,
                start: "top 90%",
            }
        });
    });

    // 2. Fade In Animation (Slide up and fade)
    gsap.utils.toArray('.fade-in').forEach(el => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
            }
        });
    });

    // 3. Project Image Parallax
    gsap.utils.toArray('.split-project__image img').forEach(img => {
        gsap.to(img, {
            scale: 1.1,
            scrollTrigger: {
                trigger: img,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
}

/**
 * Premium Magnetic Cursor
 */
function initMagneticCursor() {
    const cursor = document.querySelector('.cursor');
    if (!cursor) return;

    window.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1
        });
    });

    // Hover effects
    const targets = document.querySelectorAll('a, button, .rx-card, .split-project');
    targets.forEach(target => {
        target.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
            gsap.to(cursor, { scale: 1.5, duration: 0.3 });
        });
        target.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            gsap.to(cursor, { scale: 1, duration: 0.3 });
        });
    });
}
