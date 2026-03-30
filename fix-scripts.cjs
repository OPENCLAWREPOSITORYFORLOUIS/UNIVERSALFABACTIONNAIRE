const fs = require('fs');

const files = ['work.html', 'vault.html', 'microsoft.html', 'index.html', 'select.html', 'devis-automatique.html'];

files.forEach(f => {
    if(!fs.existsSync(f)) return;
    let s = fs.readFileSync(f, 'utf8');
    s = s.replace(/<script src="https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/gsap\/3.12.5\/gsap.min.js"><\/script>\r?\n/g, '');
    s = s.replace(/<script src="https:\/\/unpkg.com\/@barba\/core"><\/script>\r?\n/g, '');
    s = s.replace(/<!-- Core Libraries -->\r?\n/g, '');
    s = s.replace(/<!-- Core Libraries \(CDNs\) - Required for the site animations -->\r?\n/g, '');
    fs.writeFileSync(f, s);
});
console.log('Fixed scripts');
