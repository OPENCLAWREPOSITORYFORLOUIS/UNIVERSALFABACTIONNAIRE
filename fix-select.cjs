const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Mes Sites Web\\onto universal\\ontooriginal', 'select.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Meta & SEO Fixes
content = content.replace(/<!-- Mirrored from.*HTTrack Website Copier.*-->/g, '');
content = content.replace(/content="we_are_onto\.jpg"/g, 'content="img/tete%20d\'affiche%20parc%20de%20restaurant.jpeg"');
content = content.replace(/content="ONTO — The Founder Studio[^>]*"/i, 'content="Universal Fab — Devenez actionnaire de la référence en restauration mobile. Investissez dans des fruck trucks connectés, durables et design."');

// 2. Add shared-header.js if missing
if (!content.includes('js/shared-header.js')) {
    content = content.replace('<script defer src="dist/index.js"></script>', '<script defer src="dist/index.js"></script>\n    <script defer src="js/shared-header.js"></script>');
}

// 3. Replace Videos securely instead of greedy regex
content = content.replace(/<video loop playsinline muted autoplay preload="auto" class="click-sound" style="cursor:pointer; pointer-events:auto; position:relative; z-index:50;">[\s\S]*?<source src="video\/pub_universal_fab.mp4" type="video\/mp4" \/>[\s\S]*?<\/video>/gi, '<img src="img/tete d\'affiche parc de restaurant.jpeg" class="full link" data-mango />');

content = content.replace(/<video playsinline muted loop autoplay class="full link" data-mango src="video\/close up restaurant\.mp4"><\/video>/gi, '<img src="img/in.jpeg" class="full link" data-mango />');

// 4. Also replace the new style GSAP splash script if it was duplicated, but select.html didn't have it.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed select.html correctly.');
