// api/create-payment.js
// Vercel Serverless Function — Naboopay v2

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const NABOO_API_KEY = (process.env.NABOO_API_KEY || '').trim();
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').trim();

  if (!NABOO_API_KEY) {
    return res.status(500).json({ error: 'NABOO_API_KEY manquante dans les variables Vercel.' });
  }

  try {
    const { userId, projectId, amount } = req.body;
    const numAmount = Math.round(parseFloat(amount));

    if (!userId || !projectId || !numAmount || numAmount < 200) {
      return res.status(400).json({ error: 'Montant invalide (minimum 200 FCFA).' });
    }

    const nabooBody = {
      method_of_payment: ['wave', 'orange_money'],
      products: [{ name: 'Action Universal Fab', price: numAmount, quantity: 1 }],
      success_url: `${APP_URL}/espace-actionnaire.html?payment=success&project=${projectId}`,
      error_url: `${APP_URL}/espace-actionnaire.html?payment=error`,
      fees_customer_side: false,
      is_escrow: false,
    };

    console.log('NABOO REQUEST:', JSON.stringify(nabooBody));
    console.log('NABOO KEY (debut):', NABOO_API_KEY.substring(0, 20));

    const nabooRes = await fetch('https://api.naboopay.com/api/v2/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NABOO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(nabooBody),
    });

    const rawText = await nabooRes.text();
    console.log('NABOO RESPONSE status:', nabooRes.status, '| body:', rawText || '(vide)');

    let nabooData = {};
    try { nabooData = JSON.parse(rawText); } catch (e) { nabooData = { rawResponse: rawText }; }

    if (!nabooRes.ok) {
      return res.status(500).json({
        error: `Naboopay erreur ${nabooRes.status}`,
        detail: nabooData,
      });
    }

    return res.status(200).json({
      checkout_url: nabooData.checkout_url,
      order_id: nabooData.order_id,
    });

  } catch (err) {
    console.error('Erreur serveur:', err.message);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
