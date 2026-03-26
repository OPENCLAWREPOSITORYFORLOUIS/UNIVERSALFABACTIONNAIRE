// api/create-payment.js
// Vercel Serverless Function — Creates a Naboopay checkout session

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const NABOO_API_KEY = process.env.NABOO_API_KEY;
  const APP_URL = process.env.APP_URL || 'https://actionuniversalfab.com';

  try {
    const { userId, userEmail, projectId, projectName, amount } = req.body;
    
    // Dynamically resolve APP_URL so the user's config errors won't break it
    let baseUrl = process.env.APP_URL || req.headers.origin;
    if (!baseUrl && req.headers.host) {
      baseUrl = `https://${req.headers.host}`;
    }
    // Remove trailing slash if present
    if (baseUrl && baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    if (!NABOO_API_KEY) {
      console.error('NABOO_API_KEY is missing in env');
      return res.status(500).json({ error: 'Config server error: NABOO_API_KEY is not defined in Vercel. Make sure names match (NABOO_API_KEY with underscores).' });
    }

    if (!userId || !projectId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call Naboopay API to create a payment transaction
    const nabooRes = await fetch('https://api.naboopay.com/api/v1/transaction/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NABOO_API_KEY}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        description: `Investissement Universal Fab — ${projectName}`,
        success_url: `${baseUrl}/espace-actionnaire.html?payment=success&project=${projectId}`,
        error_url: `${baseUrl}/espace-actionnaire.html?payment=error`,
        // Metadata to track which user / project this payment belongs to
        metadata: {
          user_id: userId,
          user_email: userEmail,
          project_id: projectId,
          project_name: projectName,
        },
      }),
    });

    const nabooData = await nabooRes.json();

    if (!nabooRes.ok) {
      console.error('Naboopay error:', nabooData);
      // Return the exact error to the frontend for easy debugging
      return res.status(500).json({ 
        error: 'Naboopay a rejeté la demande.', 
        detail: nabooData 
      });
    }

    // Return the checkout URL for the frontend to redirect the user
    return res.status(200).json({
      checkout_url: nabooData.checkout_url || nabooData.url,
      transaction_id: nabooData.id,
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
