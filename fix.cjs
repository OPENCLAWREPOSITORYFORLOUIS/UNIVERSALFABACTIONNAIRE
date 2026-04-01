const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let s = fs.readFileSync(f, 'utf8');
    
    // 1. Restore lottie.js if missing
    if (!s.includes('libs/lottie.js')) {
        s = s.replace('<script defer src="dist/index.js"></script>', '<script defer src="libs/lottie.js"></script>\n    <script defer src="dist/index.js"></script>');
    }
    
    // 2. Ensure extra CSS for visibility if main bundle fails (inline head)
    if (!s.includes('.home__content, .header, .cursor { opacity: 1 !important;')) {
        const extraCss = `
    <!-- Force visibility if main bundle fails -->
    <style>
        .home__content, .header, .cursor { opacity: 1 !important; visibility: visible !important; }
        .text-anim, .img-anim .img-container { opacity: 1 !important; visibility: visible !important; transform: none !important; }
        #lottie { display: block !important; opacity: 1 !important; }
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
             document.querySelectorAll('.home__content, .header').forEach(el => {
                 el.style.opacity = '1';
                 el.style.visibility = 'visible';
             });
        });
    </script>
        `;
        s = s.replace('</head>', `${extraCss}\n</head>`);
    }

    // 3. Ensure a dummy video tag exists at the BODY level to prevent null pointer crashes in dist/index.js
    const dummyVideoDiv = '<div id="dummy-video-marker" style="display:none"><video muted playsinline style="display:none;" class="click-sound"><!-- Dummy to avoid JS errors --></video></div>';
    if (!s.includes('dummy-video-marker')) {
        s = s.replace('</body>', `${dummyVideoDiv}</body>`);
    }

    // 4. Ensure .home__content__video has a video even if empty
    const dummyVideo = '<video muted playsinline style="display:none;" class="click-sound"><!-- Dummy to avoid JS errors --></video>';
    s = s.replace(/<div class="home__content__video">[\s\S]*?<\/div>/gi, `<div class="home__content__video">${dummyVideo}</div>`);

    fs.writeFileSync(f, s);
    console.log('Final fix applied to ' + f);
});
