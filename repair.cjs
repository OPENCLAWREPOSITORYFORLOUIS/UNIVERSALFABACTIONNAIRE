const fs = require('fs');

const espacePath = 'c:\\Mes Sites Web\\onto universal\\ontooriginal\\espace-actionnaire.html';
let espace = fs.readFileSync(espacePath, 'utf8');

// 1. Revert Naboopay back to Frontend to bypass Vercel IP Block
espace = espace.replace(/const res = await fetch\('\/api\/create-payment', \{[\s\S]*?const data = await res\.json\(\);/m, 
`const NABOO_KEY = 'pk_live_naboo_L8ZjXhlaNBuQU6N-_7a-ZMFVGBgaKuuhCJcKAeZy5XM=';
    const APP_URL = window.location.origin;

    const res = await fetch('https://api.naboopay.com/api/v2/transactions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${NABOO_KEY}\`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        method_of_payment: ['wave', 'orange_money'],
        products: [{ name: 'Action Universal Fab', price: amount, quantity: 1 }],
        success_url: \`\${APP_URL}/espace-actionnaire.html?payment=success&project=\${projectId}\`,
        error_url: \`\${APP_URL}/espace-actionnaire.html?payment=error\`,
        fees_customer_side: false,
        is_escrow: false,
      }),
    });

    const data = await res.json();`);

fs.writeFileSync(espacePath, espace, 'utf8');

// 2. Fix external links to actionuniversalfab.com -> espace-actionnaire.html
const allFiles = fs.readdirSync('c:\\Mes Sites Web\\onto universal\\ontooriginal').filter(f => f.endsWith('.html'));
allFiles.forEach(f => {
    let content = fs.readFileSync('c:\\Mes Sites Web\\onto universal\\ontooriginal\\' + f, 'utf8');
    content = content.replace(/https:\/\/www\.actionuniversalfab\.com/g, 'espace-actionnaire.html');
    fs.writeFileSync('c:\\Mes Sites Web\\onto universal\\ontooriginal\\' + f, content, 'utf8');
});

console.log("Fixed Links and Naboopay.");
