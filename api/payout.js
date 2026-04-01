// api/payout.js
// Vercel Serverless Function — Processes dividend withdrawal via PayDunya Disbursement
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

  try {
    const { userId, amount, phoneNumber, phoneOperator } = req.body;

    if (!userId || !amount || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Check user balance in Supabase
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('dividends_balance')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (profile.dividends_balance < amount) {
      return res.status(400).json({ error: 'Insufficient dividend balance' });
    }

    // 2. Prepare PayDunya Disbursement (v2)
    const isTest = process.env.PAYDUNYA_MODE === 'test';
    const API_BASE = isTest 
      ? 'https://app.paydunya.com/sandbox-api/v2' 
      : 'https://app.paydunya.com/api/v2';

    // Map operator for PayDunya v2
    let withdraw_mode = (phoneOperator || 'WAVE').toLowerCase();
    if (withdraw_mode === 'orange' || withdraw_mode === 'om') withdraw_mode = 'orange-money-senegal';
    else if (withdraw_mode === 'free') withdraw_mode = 'free-money-senegal';
    else if (withdraw_mode === 'wave') withdraw_mode = 'wave-senegal';
    else if (!withdraw_mode.includes('-')) withdraw_mode += '-senegal';

    const getInvoicePayload = {
      account_alias: phoneNumber.replace(/^\+221/, '').replace(/\s/g, ''),
      amount: amount,
      withdraw_mode: withdraw_mode,
      callback_url: `${APP_URL}/api/paydunya-ipn`
    };

    // Step A: Get Invoice Token
    const getInvRes = await fetch(`${API_BASE}/disburse/get-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(getInvoicePayload)
    });

    const invData = await getInvRes.json();
    if (invData.response_code !== '00') {
      return res.status(500).json({ error: 'PayDunya Invoice Error', detail: invData.response_text || invData });
    }

    const disburseToken = invData.disburse_token;

    // Step B: Submit Invoice
    const submitRes = await fetch(`${API_BASE}/disburse/submit-invoice`, {
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
    
    // 3. Handle result
    if (submitData.response_code === '00') {
      // Record payout in history as pending (will be 'paid' after IPN)
      await supabase.from('payouts').insert({
        user_id: userId,
        amount: amount,
        phone_number: phoneNumber,
        operator: phoneOperator,
        status: 'pending',
        naboopay_payout_id: disburseToken,
        created_at: new Date().toISOString()
      });

      return res.status(200).json({ 
        success: true, 
        message: `Retrait de ${amount} FCFA initié. En attente de virement.` 
      });
    } else {
      return res.status(500).json({ error: 'PayDunya Submission Error', detail: submitData.response_text || submitData });
    }

  } catch (err) {
    console.error('Payout error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
