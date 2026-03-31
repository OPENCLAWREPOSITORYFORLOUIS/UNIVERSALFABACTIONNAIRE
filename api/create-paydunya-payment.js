
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\/$/, '');

  const { amount, projectId, projectName, userId } = req.body;
  const isSandbox = PRIVATE_KEY.startsWith('test_');
  const baseUrl = isSandbox ? 'https://sandbox.paydunya.com' : 'https://app.paydunya.com';

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
    },
    custom_data: { userId, projectId, amount }
  };

  try {
    const pdRes = await fetch(`${baseUrl}/api/v1/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Paydunya-Master-Key': MASTER_KEY,
        'X-Paydunya-Private-Key': PRIVATE_KEY,
        'X-Paydunya-Token': TOKEN
      },
      body: JSON.stringify(invoice)
    });

    const bodyText = await pdRes.text();
    console.log('RAW PAYDUNYA RESPONSE:', bodyText);

    try {
      const data = JSON.parse(bodyText);
      if (data.response_code === '00') {
        return res.status(200).json({
          token: data.token,
          redirect_url: `${baseUrl}/checkout/invoice/${data.token}`
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
