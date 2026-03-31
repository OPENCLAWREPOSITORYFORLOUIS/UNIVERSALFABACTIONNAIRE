// api/payout.js
// Processes dividend withdrawal via PayDunya Disbursement API (v2)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\/$/, '');
  
  const isSandbox = PRIVATE_KEY.startsWith('test_');
  const baseUrl = isSandbox ? 'https://app.paydunya.com/sandbox-api/v2' : 'https://app.paydunya.com/api/v2';

  try {
    const { userId, amount, phoneNumber, phoneOperator } = req.body;

    // Format phone: remove country code and spaces (ex: +221 77... -> 77...)
    const cleanPhone = phoneNumber.replace(/^\+221/, '').replace(/\s/g, '');

    // Map operators
    const operatorMap = {
      'WAVE': 'wave-senegal',
      'ORANGE': 'orange-money-senegal',
      'FREE': 'free-money-senegal'
    };
    const pdOperator = operatorMap[(phoneOperator || 'WAVE').toUpperCase()] || 'wave-senegal';

    // 1. Fetch profile to check balance
    const { data: profile } = await supabase.from('profiles').select('dividends_balance').eq('id', userId).single();
    if (!profile || profile.dividends_balance < amount) return res.status(400).json({ error: 'Solde insuffisant.' });

    // Step 1: Get Disburse Invoice
    const disbursePayload = {
      account_alias: cleanPhone,
      amount: amount,
      withdraw_mode: pdOperator,
      callback_url: `${APP_URL}/api/paydunya-ipn`
    };

    const initRes = await fetch(`${baseUrl}/disburse/get-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(disbursePayload)
    });

    const initData = await initRes.json();
    console.log('DISBURSE INIT RESPONSE:', initData);

    if (initData.response_code !== '00') {
      return res.status(500).json({ error: 'PayDunya Init: ' + (initData.response_text || 'Error') });
    }

    const disburseToken = initData.disburse_token;

    // Step 2: Submit Disburse Invoice
    const submitRes = await fetch(`${baseUrl}/disburse/submit-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify({ disburse_invoice: disburseToken })
    });

    const submitData = await submitRes.json();
    console.log('DISBURSE SUBMIT RESPONSE:', submitData);

    if (submitData.response_code === '00') {
      // Deduct from balance
      await supabase.from('profiles').update({ dividends_balance: profile.dividends_balance - amount }).eq('id', userId);
      
      // Record history
      await supabase.from('payouts').insert({
        user_id: userId,
        amount: amount,
        phone_number: cleanPhone,
        operator: phoneOperator,
        status: 'pending',
        naboopay_payout_id: disburseToken,
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Transfert initié avec succès !' });
    } else {
       return res.status(500).json({ error: 'PayDunya Submit: ' + (submitData.response_text || 'Error') });
    }

  } catch (err) {
    console.error('Payout Internal Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
