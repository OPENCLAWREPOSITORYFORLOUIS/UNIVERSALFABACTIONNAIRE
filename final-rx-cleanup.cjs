const fs = require('fs');

const rxFiles = ['devis-rx1.html', 'devis-rx2.html', 'devis-rx3.html', 'devis-rx4.html'];

rxFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');

    // 1. Remove the individual module calls as they are now in global bundles
    content = content.replace(/<link href="css\/premium-devis\.css" rel="stylesheet">\r?\n/g, '');
    content = content.replace(/<script defer src="js\/devis-export\.js"><\/script>\r?\n/g, '');
    
    // 2. Ensure shared-header.js is there (it should be)
    if (!content.includes('js/shared-header.js')) {
        content = content.replace('</head>', '    <script defer src="js/shared-header.js"></script>\n</head>');
    }

    // 3. Make sure the table container class 'rx-config' is present
    // Based on the screenshot it looked like some styles weren't applying.
    // The CSS in premium-devis.css (now in index.css) relies on .rx-config, .rx-table, etc.
    
    fs.writeFileSync(f, content, 'utf8');
});

console.log('RX Pages cleaned and globalized.');
