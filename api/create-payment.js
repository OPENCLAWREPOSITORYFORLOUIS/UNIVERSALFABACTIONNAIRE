// api/create-payment.js
// Vercel Serverless Function — Creates a Naboopay checkout session

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const NABOO_API_KEY = (process.env.NABOO_API_KEY || '').trim();
  const APP_URL = process.env.APP_URL || 'https://universalfabsn.space';

  try {
    const { userId, userEmail, projectId, projectName, amount } = req.body;

    if (!NABOO_API_KEY) {
      console.error('NABOO_API_KEY is missing in env');
      return res.status(500).json({ error: 'Config server error: NABOO_API_KEY is not defined in Vercel. Make sure names match (NABOO_API_KEY with underscores).' });
    }

    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) {
      return res.status(400).json({ error: 'Projet invalide.' });
    }

    const numAmount = parseInt(amount);
    const minAmount = project.min_shares * project.price_per_share;

    if (!userId || !projectId || !numAmount || numAmount < minAmount) {
      return res.status(400).json({ error: `Montant invalide (minimum ${minAmount} FCFA)` });
    }

    // Call Naboopay API V2
    const nabooRes = await fetch('https://api.naboopay.com/api/v2/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NABOO_API_KEY}`,
      },
      body: JSON.stringify({
        method_of_payment: ['wave', 'orange_money'],
        products: [
          {
            name: project.name,
            price: project.price_per_share, // Unit price
            quantity: numAmount / project.price_per_share, // Number of shares
            description: `Achat d'actions ${project.name}`
          }
        ],
        success_url: `${APP_URL}/espace-actionnaire.html?payment=success`,
        error_url: `${APP_URL}/espace-actionnaire.html?payment=error`,
        is_escrow: false,
        fees_customer_side: false
      }),
    });

    const responseText = await nabooRes.text();
    let nabooData = {};
    try {
      nabooData = JSON.parse(responseText);
    } catch (e) {
      nabooData = { rawResponse: responseText };
    }

    if (!nabooRes.ok) {
      console.error('Naboopay V2 Error:', nabooRes.status, responseText);
      return res.status(nabooRes.status).json({ 
        error: `Naboopay API V2 Error (${nabooRes.status})`, 
        detail: nabooData 
      });
    }

    // Return checkout_url and order_id as per V2 documentation
    return res.status(200).json({
      checkout_url: nabooData.checkout_url,
      order_id: nabooData.order_id,
    });

  } catch (err) {
    console.error('Fatal Server Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
