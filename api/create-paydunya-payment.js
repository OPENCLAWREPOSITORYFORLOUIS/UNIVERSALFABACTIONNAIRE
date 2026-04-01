
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

  const isTest = process.env.PAYDUNYA_MODE === 'test';
  const BASE_URL = isTest 
    ? 'https://app.paydunya.com/sandbox-api/v1' 
    : 'https://app.paydunya.com/api/v1';

  const { amount, projectId, projectName, userId } = req.body;

  const invoice = {
    invoice: {
      total_amount: amount,
      description: `Investissement dans ${projectName} (Universal Fab)`,
    },
    store: {
      name: "Universal Fab",
      website_url: APP_URL,
    },
    actions: {
      cancel_url: `${APP_URL}/espace-actionnaire.html?payment=cancel`,
      return_url: `${APP_URL}/espace-actionnaire.html?payment=success&project=${projectId}`,
      callback_url: `${APP_URL}/api/paydunya-ipn` 
    },
    custom_data: { userId, projectId, amount }
  };

  try {
    const pdRes = await fetch(`${BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(invoice)
    });

    const bodyText = await pdRes.text();
    console.log('PAYDUNYA STATUS:', pdRes.status);
    console.log('PAYDUNYA HEADERS:', JSON.stringify([...pdRes.headers]));
    console.log('RAW PAYDUNYA RESPONSE:', bodyText.substring(0, 500));

    try {
      const data = JSON.parse(bodyText);
      if (data.response_code === '00') {
        return res.status(200).json({
          token: data.token,
          redirect_url: `https://app.paydunya.com/checkout/invoice/${data.token}`
        });
      } else {
        return res.status(500).json({ error: 'PayDunya: ' + (data.response_text || bodyText) });
      }
    } catch (e) {
      return res.status(500).json({ error: 'PayDunya return HTML/Non-JSON', response: bodyText.substring(0, 100) });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal Error', message: err.message });
  }
}
