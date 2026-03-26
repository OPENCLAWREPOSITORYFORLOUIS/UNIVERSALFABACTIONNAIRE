// api/payout.js
// Vercel Serverless Function — Processes dividend withdrawal via Naboopay Payout

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const NABOO_API_KEY = process.env.NABOO_API_KEY;

  try {
    const { userId, amount, phoneNumber, phoneOperator } = req.body;

    if (!userId || !amount || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check the user's available dividend balance in Supabase
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

    // Deduct the payout from Supabase immediately (pessimistic lock)
    const { error: deductErr } = await supabase
      .from('profiles')
      .update({ dividends_balance: profile.dividends_balance - amount })
      .eq('id', userId);

    if (deductErr) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Send payout via Naboopay API
    const nabooRes = await fetch('https://api.naboopay.com/api/v1/payout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NABOO_API_KEY}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        phone_number: phoneNumber,
        operator: phoneOperator || 'WAVE', // WAVE, ORANGE_MONEY, FREE_MONEY
        description: 'Retrait de dividendes — Universal Fab',
        metadata: { user_id: userId },
      }),
    });

    const nabooData = await nabooRes.json();

    // If Naboopay payout fails, refund the user's balance in Supabase
    if (!nabooRes.ok) {
      await supabase
        .from('profiles')
        .update({ dividends_balance: profile.dividends_balance })
        .eq('id', userId);
      console.error('Naboopay payout error:', nabooData);
      return res.status(500).json({ error: 'Payout failed', detail: nabooData });
    }

    // Record payout in history
    await supabase.from('payouts').insert({
      user_id: userId,
      amount: amount,
      phone_number: phoneNumber,
      operator: phoneOperator,
      status: 'pending',
      naboopay_payout_id: nabooData.id,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: `Retrait de ${amount} FCFA en cours de traitement` });

  } catch (err) {
    console.error('Payout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
