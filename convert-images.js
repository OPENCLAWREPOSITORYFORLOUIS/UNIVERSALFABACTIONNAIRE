import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const baseDir = 'c:\\Mes Sites Web\\onto universal\\ontooriginal';
const imgDir = path.join(baseDir, 'img');
const images = fs.readdirSync(imgDir).filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg'));

images.forEach(img => {
    const input = path.join(imgDir, img);
    const output = path.join(imgDir, img.replace(/\.(jpeg|jpg)$/i, '.webp'));
    console.log(`Converting: ${img} to WebP...`);
    try {
        execSync(`ffmpeg -i "${input}" -quality 75 "${output}" -y`);
        console.log(`Success: ${output}`);
    } catch (e) {
        console.error(`Error converting ${img}:`, e.message);
    }
});

// Update HTML files to use .webp
const htmlFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    images.forEach(img => {
        const webpName = img.replace(/\.(jpeg|jpg)$/i, '.webp');
        // Simple replace for both name and space variations
        content = content.split(img).join(webpName);
        // Also handle encoded spaces in URL if any
        const encodedImg = encodeURIComponent(img);
        const encodedWebp = encodeURIComponent(webpName);
        content = content.split(encodedImg).join(encodedWebp);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated HTML: ${file}`);
});
