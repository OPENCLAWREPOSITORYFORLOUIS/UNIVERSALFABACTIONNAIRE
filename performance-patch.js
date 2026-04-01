import fs from 'fs';
import path from 'path';

const baseDir = 'c:\\Mes Sites Web\\onto universal\\ontooriginal';
const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove redundant Lottie
    content = content.replace(/<script defer src="libs\/lottie\.js"><\/script>/g, '');

    // 2. Fix Video Preload
    content = content.replace(/<video(?!.*preload="metadata")/g, '<video preload="metadata"');
    content = content.replace(/preload="auto"/g, 'preload="metadata"');

    // 3. Ensure Lazy Loading for Images
    content = content.replace(/<img (?!.*loading="lazy")/g, '<img loading="lazy" ');

    // 4. Remove redundant GSAP/Barba if present (from CDNs)
    content = content.replace(/<script defer src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/gsap\.min\.js"><\/script>/g, '');
    content = content.replace(/<script defer src="https:\/\/unpkg\.com\/@barba\/core"><\/script>/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized: ${file}`);
});
