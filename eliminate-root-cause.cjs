const fs = require('fs');
const path = require('path');

const cssModule = fs.readFileSync('c:\\Mes Sites Web\\onto universal\\ontooriginal\\css\\premium-devis.css', 'utf8');
const jsModule = fs.readFileSync('c:\\Mes Sites Web\\onto universal\\ontooriginal\\js\\devis-export.js', 'utf8');

const mainCssPath = 'c:\\Mes Sites Web\\onto universal\\ontooriginal\\dist\\index.css';
const mainJsPath = 'c:\\Mes Sites Web\\onto universal\\ontooriginal\\js\\shared-header.js';

let mainCss = fs.readFileSync(mainCssPath, 'utf8');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Append CSS only if not already merged
if (!mainCss.includes('rx-config__header')) {
    mainCss += '\n\n/* --- INJECTED DEVIS MODULE CSS --- */\n' + cssModule;
    fs.writeFileSync(mainCssPath, mainCss, 'utf8');
    console.log('Appended premium-devis.css to dist/index.css');
}

// Append JS only if not already merged
if (!mainJs.includes('function exportToPDF()')) {
    mainJs += '\n\n/* --- INJECTED PDF EXPORT JS --- */\n' + jsModule;
    fs.writeFileSync(mainJsPath, mainJs, 'utf8');
    console.log('Appended devis-export.js to shared-header.js');
}

console.log('Root problems eliminated.');
