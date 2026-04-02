// api/payout.js
// Vercel Serverless Function — Dividend withdrawal via PayDunya v2 Disburse (API PUSH)
// Flow: get-invoice → submit-invoice → callback on IPN
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// PayDunya v2 Disburse supported withdraw_modes (Sénégal)
// Note: wave-senegal requires activation in PayDunya dashboard
const OPERATOR_MAP = {
  'WAVE':         'wave-senegal',
  'ORANGE_MONEY': 'orange-money-senegal',
  'ORANGE':       'orange-money-senegal',
  'FREE_MONEY':   'free-money-senegal',
  'FREE':         'free-money-senegal',
  'EXPRESSO':     'expresso-senegal',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // IMPORTANT: Disburse v2 has NO sandbox mode.
  // It ALWAYS requires LIVE keys on the LIVE endpoint.
  // For test mode, we use separate LIVE disbursement keys stored in env.
  const MASTER_KEY  = (process.env.PAYDUNYA_MASTER_KEY || '').trim();
  const PRIVATE_KEY = (process.env.PAYDUNYA_DISBURSE_PRIVATE_KEY || process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  const TOKEN       = (process.env.PAYDUNYA_DISBURSE_TOKEN || process.env.PAYDUNYA_TOKEN || '').trim();
  const APP_URL     = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\/$/, '');

  // Disburse ALWAYS uses the LIVE v2 endpoint (no sandbox exists)
  const API_BASE = 'https://app.paydunya.com/api/v2';

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
        error: `L'opérateur "${phoneOperator}" n'est pas supporté. Utilisez Wave, Orange Money ou Free Money.`,
        supported: Object.keys(OPERATOR_MAP)
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

    // In test mode (PAYDUNYA_MODE=test), simulate success since Disburse has no sandbox
    if (process.env.PAYDUNYA_MODE === 'test') {
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
        message: `[TEST] Retrait simulé de ${amount} FCFA via ${withdraw_mode}.`
      });
    }

    // 2. LIVE MODE — PayDunya v2 Disburse (API PUSH)
    // account_alias = phone WITHOUT country code (doc requirement)
    const cleanPhone = phoneNumber.replace(/^\+221/, '').replace(/\s/g, '');

    // Step A: Get Invoice Token
    const getInvoicePayload = {
      account_alias: cleanPhone,
      amount: amount,
      withdraw_mode: withdraw_mode,
      callback_url: `${APP_URL}/api/paydunya-ipn`
    };

    console.log('Disburse get-invoice:', JSON.stringify(getInvoicePayload));

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
    console.log('Disburse get-invoice response:', getInvRes.status, invText);

    let invData;
    try { invData = JSON.parse(invText); } catch {
      return res.status(500).json({ error: 'Réponse invalide de PayDunya.', raw: invText.substring(0, 200) });
    }

    if (invData.response_code !== '00') {
      return res.status(500).json({
        error: invData.response_text || 'Erreur PayDunya Disburse.',
        code: invData.response_code
      });
    }

    const disburseToken = invData.disburse_token;

    // Step B: Submit Invoice to execute the disbursement
    const submitPayload = {
      disburse_invoice: disburseToken,
      disburse_id: `UFAB-${Date.now()}` // Our internal reference
    };

    console.log('Disburse submit-invoice:', JSON.stringify(submitPayload));

    const submitRes = await fetch(`${API_BASE}/disburse/submit-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN
      },
      body: JSON.stringify(submitPayload)
    });

    const submitText = await submitRes.text();
    console.log('Disburse submit-invoice response:', submitRes.status, submitText);

    let submitData;
    try { submitData = JSON.parse(submitText); } catch {
      // If submit fails, check status of the token
      return res.status(500).json({ error: 'Réponse invalide au submit.', raw: submitText.substring(0, 200) });
    }

    // Handle all possible statuses per documentation
    if (submitData.response_code === '00') {
      const status = submitData.status || 'pending'; // can be 'success', 'pending', or 'failed'

      await supabase.from('payouts').insert({
        user_id: userId,
        amount: amount,
        phone_number: phoneNumber,
        operator: phoneOperator,
        status: status === 'success' ? 'paid' : 'pending',
        naboopay_payout_id: disburseToken,
        created_at: new Date().toISOString()
      });

      // If success, deduct from balance immediately
      if (status === 'success') {
        await supabase.rpc('decrement_dividends', { user_id_param: userId, amount_param: amount });
      }
      // If pending, balance will be deducted when IPN callback confirms success

      return res.status(200).json({
        success: true,
        status: status,
        message: status === 'success'
          ? `Retrait de ${amount} FCFA effectué avec succès !`
          : `Retrait de ${amount} FCFA initié. En attente de confirmation.`,
        transaction_id: submitData.transaction_id
      });
    } else {
      // Per doc: if error, check status with check-status API using the token
      // Status could be CREATED (retry submit), PENDING (wait), SUCCESS, FAILED
      return res.status(500).json({
        error: submitData.response_text || 'Erreur lors du retrait.',
        code: submitData.response_code,
        advice: 'Veuillez réessayer. Si le problème persiste, contactez le support.'
      });
    }

  } catch (err) {
    console.error('Payout error:', err);
    return res.status(500).json({ error: 'Erreur interne.', details: err.message });
  }
}
