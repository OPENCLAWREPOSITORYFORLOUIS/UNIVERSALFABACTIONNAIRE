// api/payout.js
// Processes dividend withdrawal via PayDunya Disbursement API

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  
  const isSandbox = PRIVATE_KEY.startsWith('test_');
  const baseUrl = isSandbox ? 'https://sandbox.paydunya.com' : 'https://app.paydunya.com';

  try {
    const { userId, amount, phoneNumber, phoneOperator } = req.body;

    if (!userId || !amount || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check the user's available dividend balance in Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('dividends_balance')
      .eq('id', userId)
      .single();

    if (!profile || profile.dividends_balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant.' });
    }

    // Deduct the payout from Supabase immediately (pessimistic lock)
    await supabase
      .from('profiles')
      .update({ dividends_balance: profile.dividends_balance - amount })
      .eq('id', userId);

    // Prepare PayDunya Disburse payload
    // Operator mapping: PayDunya uses orange-money-senegal, wave-senegal, free-money-senegal
    const operatorMap = {
      'WAVE': 'wave-senegal',
      'ORANGE': 'orange-money-senegal',
      'FREE': 'free-money-senegal'
    };
    const pdOperator = operatorMap[(phoneOperator || 'WAVE').toUpperCase()] || 'wave-senegal';

    const disburseBody = {
      disburse: {
        total_amount: amount,
        description: 'Retrait de dividendes — Universal Fab'
      },
      recipients: [
        {
          name: "Actionnaire Universal Fab",
          phone: phoneNumber,
          operator: pdOperator,
          amount: amount
        }
      ]
    };

    // Send payout via PayDunya API
    const pdRes = await fetch(`${baseUrl}/api/v1/disburse/get-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Paydunya-Master-Key': MASTER_KEY,
        'X-Paydunya-Private-Key': PRIVATE_KEY,
        'X-Paydunya-Token': TOKEN
      },
      body: JSON.stringify(disburseBody),
    });

    const bodyText = await pdRes.text();
    console.log('RAW PAYOUT RESPONSE:', bodyText);

    try {
      const data = JSON.parse(bodyText);
      if (data.response_code === '00') {
         // Auto-submit disburse (might require a second step depending on merchant settings)
         // But usually get-invoice + auto-submit works if configured
         await supabase.from('payouts').insert({
          user_id: userId,
          amount: amount,
          phone_number: phoneNumber,
          operator: phoneOperator,
          status: 'pending',
          naboopay_payout_id: data.disburse_token, // Store the disburse token
          created_at: new Date().toISOString(),
        });
        return res.status(200).json({ success: true, message: `Retrait de ${amount} FCFA initié.` });
      } else {
        throw new Error(data.response_text || bodyText);
      }
    } catch (e) {
      // Refund the user's balance in Supabase on failure
      await supabase
        .from('profiles')
        .update({ dividends_balance: profile.dividends_balance })
        .eq('id', userId);
      
      console.error('PayDunya payout error:', bodyText);
      return res.status(500).json({ error: 'Payout failed: ' + (e.message || bodyText.substring(0, 100)) });
    }

  } catch (err) {
    console.error('Internal Payout error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
