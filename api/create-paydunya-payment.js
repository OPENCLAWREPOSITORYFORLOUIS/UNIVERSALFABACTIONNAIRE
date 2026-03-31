
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\/$/, '');

  const { amount, projectId, projectName, userId } = req.body;
  const isSandbox = PRIVATE_KEY.startsWith('test_');
  const baseUrl = isSandbox ? 'https://app.paydunya.com/sandbox-api/v1' : 'https://app.paydunya.com/api/v1';

  const invoiceBody = {
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
    const pdRes = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(invoiceBody)
    });

    const bodyText = await pdRes.text();
    console.log('RAW PAYDUNYA RESPONSE:', bodyText);

    try {
      const data = JSON.parse(bodyText);
      if (data.response_code === '00') {
        return res.status(200).json({
          token: data.token,
          redirect_url: data.response_text // In v1 Checkout, the URL is in response_text
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
