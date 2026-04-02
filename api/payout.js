// api/payout.js
// Vercel Serverless Function — Processes dividend withdrawal via PayDunya v2 Disbursement
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// PayDunya v2 Disburse ONLY supports these modes (Wave NOT supported):
const OPERATOR_MAP = {
  'ORANGE_MONEY': 'orange-money-senegal',
  'ORANGE':       'orange-money-senegal',
  'FREE_MONEY':   'free-money-senegal',
  'FREE':         'free-money-senegal',
  // Wave is NOT supported by PayDunya Disburse v2
  'WAVE':         null,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const MASTER_KEY = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN = (process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

  // NOTE: PayDunya v2 Disburse has NO sandbox mode.
  // It always uses the LIVE endpoint. Test keys won't work.
  // For actual disbursement, LIVE keys with KYC validation are required.
  const isTest = process.env.PAYDUNYA_MODE === 'test';
  const API_BASE = 'https://app.paydunya.com/api/v2'; // Always LIVE for disburse

  try {
    const { userId, amount, phoneNumber, phoneOperator } = req.body;

    if (!userId || !amount || !phoneNumber) {
      return res.status(400).json({ error: 'Champs requis manquants (userId, amount, phoneNumber).' });
    }

    // Validate operator
    const operatorKey = (phoneOperator || '').toUpperCase();
    const withdraw_mode = OPERATOR_MAP[operatorKey];

    if (!withdraw_mode) {
      return res.status(400).json({ 
        error: `L'opérateur "${phoneOperator}" n'est pas supporté pour les retraits PayDunya. Utilisez Orange Money ou Free Money.`,
        supported_operators: ['ORANGE_MONEY', 'FREE_MONEY']
      });
    }

    // 1. Check user balance in Supabase
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('dividends_balance')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'Profil utilisateur non trouvé.' });
    }

    if (profile.dividends_balance < amount) {
      return res.status(400).json({ error: 'Solde de dividendes insuffisant.' });
    }

    // In test mode, simulate success (PayDunya v2 Disburse has no sandbox)
    if (isTest) {
      console.log('[TEST MODE] Simulating payout:', { userId, amount, phoneNumber, withdraw_mode });
      
      await supabase.from('payouts').insert({
        user_id: userId,
        amount: amount,
        phone_number: phoneNumber,
        operator: phoneOperator,
        status: 'pending',
        naboopay_payout_id: `test_sim_${Date.now()}`,
        created_at: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        test_mode: true,
        message: `[TEST] Retrait simulé de ${amount} FCFA via ${withdraw_mode}. En production, le virement sera réel.`
      });
    }

    // 2. LIVE MODE — PayDunya v2 Disburse
    const cleanPhone = phoneNumber.replace(/^\+221/, '').replace(/\s/g, '');

    const getInvoicePayload = {
      account_alias: cleanPhone,
      amount: amount,
      withdraw_mode: withdraw_mode,
      callback_url: `${APP_URL}/api/paydunya-ipn`
    };

    console.log('Disburse get-invoice payload:', JSON.stringify(getInvoicePayload));

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

    const invText = await getInvRes.text();
    console.log('Disburse get-invoice response:', invText);

    let invData;
    try { invData = JSON.parse(invText); } catch { 
      return res.status(500).json({ error: 'PayDunya a retourné une réponse invalide.', raw: invText.substring(0, 200) });
    }

    if (invData.response_code !== '00') {
      return res.status(500).json({ 
        error: invData.response_text || 'Erreur PayDunya Disburse.',
        code: invData.response_code
      });
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

    const submitText = await submitRes.text();
    console.log('Disburse submit-invoice response:', submitText);

    let submitData;
    try { submitData = JSON.parse(submitText); } catch {
      return res.status(500).json({ error: 'PayDunya submit a retourné une réponse invalide.', raw: submitText.substring(0, 200) });
    }

    if (submitData.response_code === '00') {
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
        message: `Retrait de ${amount} FCFA initié via ${withdraw_mode}. Virement en cours.`
      });
    } else {
      return res.status(500).json({ 
        error: submitData.response_text || 'Erreur lors de la soumission du retrait.',
        code: submitData.response_code 
      });
    }

  } catch (err) {
    console.error('Payout error:', err);
    return res.status(500).json({ error: 'Erreur interne du serveur.', details: err.message });
  }
}
