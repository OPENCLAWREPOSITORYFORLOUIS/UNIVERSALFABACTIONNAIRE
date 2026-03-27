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

    if (!userId || !projectId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const numAmount = Number(amount);

    // Call Naboopay API to create a payment transaction
    const nabooRes = await fetch('https://api.naboopay.com/api/v1/transaction/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NABOO_API_KEY}`,
      },
      body: JSON.stringify({
        amount: numAmount,
        currency: 'XOF',
        description: `Investissement Universal Fab — ${projectName}`,
        method_of_payment: ['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'],
        is_merchant: true,
        is_escrow: false,
        products: [{ name: projectName, quantity: 1, amount: numAmount, category: 'digital' }],
        success_url: `${APP_URL}/espace-actionnaire.html?payment=success&project=${projectId}`,
        error_url: `${APP_URL}/espace-actionnaire.html?payment=error`,
        metadata: {
          user_id: userId,
          user_email: userEmail,
          project_id: projectId,
          project_name: projectName,
        },
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
      console.error('Naboopay API Error:', nabooRes.status, responseText);
      return res.status(500).json({ 
        error: 'Naboopay API status ' + nabooRes.status, 
        detail: nabooData,
        message: 'Consultez les logs Vercel pour plus de détails.'
      });
    }

    return res.status(200).json({
      checkout_url: nabooData.checkout_url || nabooData.url || nabooData.checkoutUrl,
      order_id: nabooData.order_id || nabooData.id,
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
