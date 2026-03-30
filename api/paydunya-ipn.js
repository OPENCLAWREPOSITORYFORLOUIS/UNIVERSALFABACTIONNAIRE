// api/paydunya-ipn.js
// IPN receiver for PayDunya
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, status, custom_data } = req.body;
  const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY;
  const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY;
  const TOKEN = process.env.PAYDUNYA_TOKEN;

  try {
    // 1. Double check the transaction status with PayDunya API
    const checkRes = await fetch(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`, {
       method: 'GET',
       headers: {
          'X-Paydunya-Master-Key': MASTER_KEY,
          'X-Paydunya-Private-Key': PRIVATE_KEY,
          'X-Paydunya-Token': TOKEN
       }
    });

    const data = await checkRes.json();
    
    // Status 'completed' means the money is safe
    if (data.status === 'completed') {
       // Logic to update Supabase 'investments' table status to 'completed' here
       // Use order_id match with the token
       return res.status(200).send('IPN OK');
    }

    return res.status(200).send('IPN Received - Pending');
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
