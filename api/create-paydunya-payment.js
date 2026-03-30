// api/create-paydunya-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\/$/, '');

  if (!MASTER_KEY || !TOKEN) {
    return res.status(400).json({ error: 'Variables d’environnement manquantes sur Vercel.' });
  }

  // AUTO-SWITCH TO SANDBOX IF KEY IS TEST
  const isSandbox = (PRIVATE_KEY || '').includes('test_');
  const baseUrl = isSandbox ? 'https://app.paydunya.com/sandbox-api' : 'https://paydunya.com/api';
  const apiPath = '/v1/checkout-invoice/create';

  const { amount, projectId, projectName, userId } = req.body;

  const invoice = {
    invoice: {
      total_amount: amount,
      description: `Investissement dans ${projectName} (Universal Fab)`,
      items: {
        item_0: {
          name: `Action ${projectName}`,
          quantity: 1,
          unit_price: amount,
          total_price: amount
        }
      }
    },
    store: {
      name: "Universal Fab",
      website_url: APP_URL,
    },
    actions: {
      cancel_url: `${APP_URL}/espace-actionnaire.html?payment=cancel`,
      return_url: `${APP_URL}/espace-actionnaire.html?payment=success&project=${projectId}`,
    },
    custom_data: { userId, projectId, amount }
  };

  try {
    const pdRes = await fetch(baseUrl + apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(invoice)
    });

    const bodyText = await pdRes.text();
    console.log(`PAYDUNYA (${isSandbox ? 'SANDBOX' : 'LIVE'}) RESPONSE:`, bodyText);

    try {
      const data = JSON.parse(bodyText);
      if (data.response_code === '00') {
         // If sandbox, use sandbox redirect URL
         const redirectBase = isSandbox ? 'https://paydunya.com/sandbox-checkout/invoice/' : 'https://paydunya.com/checkout/invoice/';
         return res.status(200).json({
           token: data.token,
           redirect_url: redirectBase + data.token
         });
      } else {
        return res.status(500).json({ error: 'PayDunya: ' + (data.response_text || bodyText) });
      }
    } catch (e) {
      return res.status(500).json({ error: 'PayDunya Error (Non-JSON)', raw: bodyText.substring(0, 100) });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal Error', message: err.message });
  }
}
