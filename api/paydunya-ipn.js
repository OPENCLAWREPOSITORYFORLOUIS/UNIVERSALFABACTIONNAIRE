// api/paydunya-ipn.js
// IPN receiver for PayDunya — Processes both Payin (Investments) and Payout (Withdrawals)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // PayDunya sends IPN data in the body
  const { token, status, custom_data, disbursement_token } = req.body;
  const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY;
  const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY;
  const TOKEN = process.env.PAYDUNYA_TOKEN;

  console.log('IPN RECEIVED. BODY:', JSON.stringify(req.body));

  try {
    const isTest = process.env.PAYDUNYA_MODE === 'test';
    const BASE_URL = isTest 
      ? 'https://app.paydunya.com/sandbox-api/v1' 
      : 'https://app.paydunya.com/api/v1';

    // CASE 1: Checkout Invoice (Investment)
    // Doc: contains 'invoice' node or no 'withdraw_mode'
    if (token && !req.body.withdraw_mode) {
      const checkRes = await fetch(`${BASE_URL}/checkout-invoice/confirm/${token}`, {
        method: 'GET',
        headers: {
          'PAYDUNYA-MASTER-KEY': MASTER_KEY,
          'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
          'PAYDUNYA-TOKEN': TOKEN
        }
      });
      const pdData = await checkRes.json();

      if (pdData.status === 'completed') {
        const { userId, projectId, amount } = pdData.custom_data || {};
        
        // 1. Update investment status
        await supabase
          .from('investments')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('order_id', token);

        // 2. Update profile balance
        if (userId && amount) {
          const { data: profile } = await supabase.from('profiles').select('total_invested, total_shares_count').eq('id', userId).single();
          if (profile) {
             const sharesToAdd = parseFloat(amount) / 10000; 
             await supabase.from('profiles').update({
               total_invested: (profile.total_invested || 0) + parseFloat(amount),
               total_shares_count: (profile.total_shares_count || 0) + sharesToAdd
             }).eq('id', userId);
          }
        }
        return res.status(200).send('Investment Verified');
      }
    }

    // CASE 2: Disbursement (Payout)
    // Doc: contains 'withdraw_mode'
    if (token && req.body.withdraw_mode) {
      if (req.body.status === 'success' || status === 'completed') {
         // 1. Update payout record
         const { data: payout, error: pErr } = await supabase
           .from('payouts')
           .update({ status: 'paid' })
           .eq('naboopay_payout_id', token)
           .select()
           .single();

         if (pErr) console.error('SUPABASE PAYOUT ERROR:', pErr);

         // 2. Deduct balance from user profile
         if (payout && payout.user_id && payout.amount) {
            const { data: profile } = await supabase.from('profiles').select('dividends_balance').eq('id', payout.user_id).single();
            if (profile) {
              await supabase.from('profiles').update({
                dividends_balance: Math.max(0, (profile.dividends_balance || 0) - payout.amount)
              }).eq('id', payout.user_id);
            }
         }
         return res.status(200).send('Payout Verified');
      }
    }

    return res.status(200).send('IPN Processed');
  } catch (err) {
    console.error('IPN CRITICAL ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
}
