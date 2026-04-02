
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const API_KEY = process.env.PAYTECH_API_KEY;
  const API_SECRET = process.env.PAYTECH_API_SECRET;
  const MODE = process.env.PAYTECH_MODE || 'test';
  const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

  const { amount, projectId, projectName, userId } = req.body;

  const ref_command = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const body = {
    item_name: `Investissement: ${projectName}`,
    item_price: amount,
    currency: "XOF",
    ref_command: ref_command,
    command_name: `Investissement dans ${projectName} (Universal Fab)`,
    env: MODE,
    ipn_url: `${APP_URL}/api/paytech-ipn`,
    success_url: `${APP_URL}/espace-actionnaire.html?payment=success&project=${projectId}`,
    cancel_url: `${APP_URL}/espace-actionnaire.html?payment=cancel`,
    custom_field: JSON.stringify({ userId, projectId, amount })
  };

  try {
    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'API_KEY': API_KEY,
        'API_SECRET': API_SECRET
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.success === 1) {
      return res.status(200).json({
        token: data.token,
        redirect_url: data.redirect_url
      });
    } else {
      console.error('PAYTECH ERROR:', data);
      return res.status(500).json({ error: 'PayTech Error: ' + (data.message || 'Unknown error') });
    }
  } catch (err) {
    console.error('FETCH ERROR:', err);
    return res.status(500).json({ error: 'Internal Error', message: err.message });
  }
}
