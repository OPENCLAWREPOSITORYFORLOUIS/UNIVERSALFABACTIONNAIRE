const fs = require('fs');

const headerHtml = `</head>
<body data-barba="wrapper">
<header class="header">
    <h1><a href="index.html" aria-label="Home"><span id="logo-lottie"></span></a></h1>
    <div class="header__menu">
        <a href="espace-actionnaire.html" class="nos-produits-bubble actionnaire-btn" data-barba-prevent="self" style="margin-right: 12px; background-color: #3D8BFF !important; border-radius: 50px !important; padding: 10px 22px !important; color: #fff !important; display: inline-flex !important; align-items: center; justify-content: center; font-size: 13px !important; font-weight: bold !important; border:none !important;">
            <span>ESPACE ACTIONNAIRE</span>
        </a>
        <a href="devis-automatique.html" class="nos-produits-bubble return-btn" id="section-toggle" style="background-color: #f1f1f1 !important; color: #111 !important; border: 1px solid #ddd !important; border-radius: 50px !important; padding: 10px 22px !important; display: inline-flex !important; align-items: center; justify-content: center; font-size: 13px !important; font-weight: bold !important;">
            <span id="section-toggle-text">Nos produits</span>
        </a>
    </div>
</header>
<main data-barba="container" data-barba-namespace="case">
`;

const rxFiles = ['devis-rx1.html', 'devis-rx2.html', 'devis-rx3.html', 'devis-rx4.html'];

rxFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // 1. Remove huge inline style
    content = content.replace(/<style>[\s\S]*?<\/style>/i, '');
    
    // 2. Make sure external CSS is linked
    if (!content.includes('premium-devis.css')) {
        content = content.replace('<script defer src="libs/lottie.js">', '<link href="css/premium-devis.css" rel="stylesheet">\n    <script defer src="libs/lottie.js">');
    }

    // 3. Inject full header and namespace AFTER the scripts if it doesn't have a body tag
    if (!content.includes('<body')) {
        content = content.replace(/<div class="case page-wrap" style="padding-left:0 !important; padding-right:0 !important;"/, headerHtml + '        <div class="case page-wrap" style="padding-left:0 !important; padding-right:0 !important;"');
        // And append </main> at the end of the file right before </body>
        if (!content.includes('</main>')) {
           content = content.replace('</body>', '</main>\n</body>');
        }
    }

    // 4. Update the footer link as well just in case repair.cjs missed it
    content = content.replace(/https:\/\/www\.actionuniversalfab\.com/g, 'espace-actionnaire.html');

    fs.writeFileSync(f, content, 'utf8');
});

console.log("RX Pages completely fixed.");
