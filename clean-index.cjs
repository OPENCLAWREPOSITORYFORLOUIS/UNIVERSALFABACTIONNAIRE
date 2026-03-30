const fs = require('fs');

const path = 'c:\\Mes Sites Web\\onto universal\\ontooriginal\\index.html';
let indexHtml = fs.readFileSync(path, 'utf8');

// Strip out the custom GSAP splash logic added recently
indexHtml = indexHtml.replace(/<style>[\s\S]*?\/\* Ensure the splash screen is visible initially and covers everything \*\/[\s\S]*?<\/style>/g, '');
indexHtml = indexHtml.replace(/<!-- Splash Screen \(Referenced by JS\) -->[\s\S]*?<\/div>\r?\n\r?\n/g, '');
indexHtml = indexHtml.replace(/<!-- Splash Screen Logic -->[\s\S]*?<\/script>/g, '');
indexHtml = indexHtml.replace(/<div id="lottie" style="display:none !important"><\/div>/g, '<div id="lottie"></div>');

fs.writeFileSync(path, indexHtml, 'utf8');
console.log('Cleaned index.html');
