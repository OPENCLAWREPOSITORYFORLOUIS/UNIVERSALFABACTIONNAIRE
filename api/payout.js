// api/payout.js
// Vercel Serverless Function — Dividend withdrawal via PayTech Transfer API
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// PayTech SN Transfer service names
const OPERATOR_MAP = {
  'WAVE':         'Wave Senegal',
  'ORANGE_MONEY': 'Orange Money Senegal',
  'ORANGE':       'Orange Money Senegal',
  'FREE_MONEY':   'Free Money Senegal',
  'FREE':         'Free Money Senegal',
  'EXPRESSO':     'Expresso Senegal',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const API_KEY = process.env.PAYTECH_API_KEY;
  const API_SECRET = process.env.PAYTECH_API_SECRET;
  const MODE = process.env.PAYTECH_MODE || 'test';
  const APP_URL = (process.env.APP_URL || 'https://universalfabsn.space').replace(/\/$/, '');

  try {
    const { userId, amount, phoneNumber, phoneOperator } = req.body;

    if (!userId || !amount || !phoneNumber) {
      return res.status(400).json({ error: 'Champs requis manquants (userId, amount, phoneNumber).' });
    }

    const operatorKey = (phoneOperator || '').toUpperCase();
    const serviceName = OPERATOR_MAP[operatorKey];

    if (!serviceName) {
      return res.status(400).json({
        error: `L'opérateur "${phoneOperator}" n'est pas supporté.`,
        supported: Object.keys(OPERATOR_MAP)
      });
    }

    // 1. Check user balance in Supabase
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('dividends_balance')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) return res.status(404).json({ error: 'Profil utilisateur non trouvé.' });
    if (profile.dividends_balance < amount) return res.status(400).json({ error: 'Solde de dividendes insuffisant.' });

    // In test mode, simulate success if needed or use real test keys
    if (MODE === 'test' && !API_KEY.startsWith('prod_')) {
      console.log('[TEST MODE] Simulating PayTech payout:', { userId, amount, phoneNumber, serviceName });
      
      await supabase.from('payouts').insert({
        user_id: userId, amount, phone_number: phoneNumber, operator: phoneOperator,
        status: 'pending', naboopay_payout_id: `test_pyt_${Date.now()}`, created_at: new Date().toISOString()
      });

      return res.status(200).json({ success: true, test_mode: true, message: `[TEST] Retrait simulé de ${amount} FCFA.` });
    }

    // 2. LIVE/PROD — PayTech Transfer API
    const transferData = {
      amount: parseInt(amount),
      destination_number: phoneNumber.replace(/\s/g, ''),
      service: serviceName,
      callback_url: `${APP_URL}/api/paytech-ipn`, // Reuse IPN or separate
      external_id: `PYT-OUT-${Date.now()}`
    };

    const response = await fetch('https://paytech.sn/api/transfer/transferFund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': API_KEY,
        'API_SECRET': API_SECRET
      },
      body: JSON.stringify(transferData)
    });

    const data = await response.json();

    if (data.success === 1) {
      await supabase.from('payouts').insert({
        user_id: userId,
        amount: amount,
        phone_number: phoneNumber,
        operator: phoneOperator,
        status: 'pending',
        naboopay_payout_id: data.transfer.token_transfer,
        created_at: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Votre retrait est en cours de traitement.',
        transfer: data.transfer
      });
    } else {
      return res.status(500).json({ error: data.message || 'Erreur PayTech Transfer.' });
    }

  } catch (err) {
    console.error('Payout error:', err);
    return res.status(500).json({ error: 'Erreur interne.', details: err.message });
  }
}
