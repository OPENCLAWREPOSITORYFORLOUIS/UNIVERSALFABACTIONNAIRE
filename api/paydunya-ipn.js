// api/paydunya-ipn.js
// IPN receiver for PayDunya
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, status, custom_data } = req.body;
  const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY;
  const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY;
  const TOKEN = process.env.PAYDUNYA_TOKEN;
  const isSandbox = (PRIVATE_KEY || '').startsWith('test_');
  const baseUrl = isSandbox ? 'https://sandbox.paydunya.com' : 'https://app.paydunya.com';

  try {
    // 1. Double check the transaction status with PayDunya API
    const checkRes = await fetch(`${baseUrl}/api/v1/checkout-invoice/confirm/${token}`, {
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
        const { userId, projectId, amount } = data.custom_data;
        const shares_count = amount / 2000; // Updated logic: 10k = 5 units so 1 unit = 2000 XOF

        // 1. Update the investment record to 'completed'
        await supabase
          .from('investments')
          .update({ status: 'completed' })
          .eq('order_id', token);

        // 2. Safely increment profile stats (atomic-ish update)
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_invested, total_shares_count')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              total_invested: (profile.total_invested || 0) + parseInt(amount),
              total_shares_count: (profile.total_shares_count || 0) + shares_count
            })
            .eq('id', userId);
        }

        return res.status(200).send('IPN OK - Database Updated');
    }

    return res.status(200).send('IPN Received - Status: ' + data.status);
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
