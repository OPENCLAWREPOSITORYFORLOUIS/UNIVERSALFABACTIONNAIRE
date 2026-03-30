// api/create-paydunya-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY;
  const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY;
  const TOKEN = process.env.PAYDUNYA_TOKEN;
  const APP_URL = process.env.APP_URL || 'https://universalfabsn.space';

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
    },
    custom_data: {
      userId: userId,
      projectId: projectId,
      amount: amount
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
    if (data.response_code === '00' && data.response_text === 'Invoice created') {
      return res.status(200).json({
        token: data.token,
        checkout_url: data.response_text === 'Invoice created' ? data.token : null, // PayDunya actually returns token as the id for redirect? No, it often has a specific response.
        // The common PayDunya v1 checkout response is a "token" that you use to redirect to https://app.paydunya.com/checkout/invoice/{token}
        redirect_url: `https://app.paydunya.com/checkout/invoice/${data.token}`
      });
    } else {
      return res.status(500).json({ error: 'PayDunya Error', detail: data });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal Error', message: err.message });
  }
}
