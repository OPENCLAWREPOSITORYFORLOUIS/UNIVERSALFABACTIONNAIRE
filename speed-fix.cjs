const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Mes Sites Web\\onto universal\\ontooriginal';

// 1. Remove cache busting for main scripts to allow browser caching and speed up Barba.js
const allFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
allFiles.forEach(file => {
    const filePath = path.join(baseDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\?v=\d+/g, ''); // Remove the dynamic versioning
    fs.writeFileSync(filePath, content, 'utf8');
});

// 2. Enhance PayDunya API with better error logs
const paydunyaPath = 'c:\\Mes Sites Web\\onto universal\\ontooriginal\\api\\create-paydunya-payment.js';
const pdCode = `
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\\/$/, '');

  if (!MASTER_KEY || !TOKEN) {
    return res.status(500).json({ error: 'Clés PayDunya manquantes dans Vercel' });
  }

  const { amount, projectId, projectName, userId } = req.body;

  const invoice = {
    invoice: {
      total_amount: amount,
      description: \`Investissement dans \${projectName} (Universal Fab)\`,
    },
    store: {
      name: "Universal Fab",
      website_url: APP_URL,
    },
    actions: {
      cancel_url: \`\${APP_URL}/espace-actionnaire.html?payment=cancel\`,
      return_url: \`\${APP_URL}/espace-actionnaire.html?payment=success&project=\${projectId}\`,
    },
    custom_data: {
      userId: userId,
      projectId: projectId
    }
  };

  try {
    const pdRes = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Paydunya-Master-Key': MASTER_KEY,
        'X-Paydunya-Private-Key': PRIVATE_KEY,
        'X-Paydunya-Token': TOKEN
      },
      body: JSON.stringify(invoice)
    });

    const data = await pdRes.json();
    console.log('PAYDUNYA RESPONSE:', JSON.stringify(data));

    if (data.response_code === '00') {
      return res.status(200).json({
        token: data.token,
        redirect_url: data.response_text === 'Invoice created' ? \`https://app.paydunya.com/checkout/invoice/\${data.token}\` : data.token
      });
    } else {
      return res.status(500).json({ 
          error: 'Erreur PayDunya: ' + (data.response_text || 'Inconnue'), 
          code: data.response_code 
      });
    }
  } catch (err) {
    console.error('SERVER ERROR:', err.message);
    return res.status(500).json({ error: 'Internal Error', message: err.message });
  }
}
`;

fs.writeFileSync(paydunyaPath, pdCode, 'utf8');
console.log('Speed restored and PayDunya API enhanced.');
