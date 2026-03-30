const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Mes Sites Web\\onto universal\\ontooriginal';

const allFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
const rxFiles = ['devis-rx1.html', 'devis-rx2.html', 'devis-rx3.html', 'devis-rx4.html'];

allFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove HTTrack Mirrors
    content = content.replace(/<!-- Mirrored from.*HTTrack Website Copier.*-->/g, '');

    // 2. Fix OG:Image
    content = content.replace(/content="we_are_onto\.jpg"/g, 'content="img/tete%20d\'affiche%20parc%20de%20restaurant.jpeg"');

    // 3. Fix Meta Description
    content = content.replace(/<meta name="description" content="ONTO — The Founder Studio[^>]*>/ig, '<meta name="description" content="Universal Fab — Devenez actionnaire de la référence en restauration mobile. Investissez dans des fruck trucks connectés, durables et design.">');
    // Also catch the other variant of the description if it exists
    content = content.replace(/<meta name="description" content="Universal Fab — La solution locale[^>]*>/ig, '<meta name="description" content="Universal Fab — Devenez actionnaire de la référence en restauration mobile. Investissez dans des fruck trucks connectés, durables et design.">');

    // 4. Remove inline styles in RX files and inject external CSS link
    if (rxFiles.includes(file)) {
        // Strip the massive inline style
        content = content.replace(/<style>[\s\S]*?<\/style>/i, '');
        
        // Ensure the external CSS link is present, right before shared-header or custom scripts
        if (!content.includes('premium-devis.css')) {
            content = content.replace('<script defer src="libs/lottie.js"></script>', '<link href="css/premium-devis.css" rel="stylesheet">\n    <script defer src="libs/lottie.js"></script>');
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('SEO and CSS linking tasks completed.');
