// api/webhook-naboopay.js
// Reçoit les notifications de paiement de Naboopay et met à jour Supabase

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const event = req.body;
    console.log('Webhook Naboopay reçu:', JSON.stringify(event));

    const orderId = event.order_id;
    const status  = event.transaction_status; // "paid", "pending", "cancelled"

    if (!orderId) {
      return res.status(400).json({ error: 'order_id manquant' });
    }

    // Seulement traiter les paiements confirmés
    if (status !== 'paid') {
      console.log('Statut non-payé ignoré:', status);
      return res.status(200).json({ received: true, action: 'ignored' });
    }

    // Chercher l'investissement en attente correspondant
    const { data: investment, error: findErr } = await supabase
      .from('investments')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .single();

    if (findErr || !investment) {
      console.error('Investissement non trouvé pour order_id:', orderId);
      return res.status(404).json({ error: 'Investment not found' });
    }

    // 1) Marquer l'investissement comme payé
    await supabase
      .from('investments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('order_id', orderId);

    // 2) Mettre à jour le profil de l'actionnaire
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_shares_count, total_invested')
      .eq('id', investment.user_id)
      .single();

    const newShares   = (profile?.total_shares_count || 0) + (investment.shares_count || 0);
    const newInvested = (profile?.total_invested || 0) + (investment.amount_paid || 0);

    await supabase
      .from('profiles')
      .update({ total_shares_count: newShares, total_invested: newInvested })
      .eq('id', investment.user_id);

    console.log(`Paiement confirmé: ${investment.shares_count} actions pour user ${investment.user_id}`);
    return res.status(200).json({ received: true, action: 'investment_confirmed' });

  } catch (err) {
    console.error('Erreur webhook:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
