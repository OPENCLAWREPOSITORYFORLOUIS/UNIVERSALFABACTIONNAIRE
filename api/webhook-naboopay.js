// api/webhook-naboopay.js
// Vercel Serverless Function — Receives Naboopay payment confirmations
// and attributes proportional shares to the investor in Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // Service role key (bypasses RLS)
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body;
    console.log('Webhook received:', JSON.stringify(event));

    // Only process completed payments
    const status = event.status || event.transaction?.status;
    if (status !== 'successful' && status !== 'paid' && status !== 'PAID') {
      return res.status(200).json({ received: true, note: 'Non-payment event ignored' });
    }

    // Extract payment details from the webhook payload
    const amountPaid  = event.amount || event.transaction?.amount || 0;
    const metadata    = event.metadata || event.transaction?.metadata || {};
    const { user_id, user_email, project_id, project_name } = metadata;

    if (!user_id || !project_id) {
      console.error('Missing metadata in webhook', metadata);
      return res.status(400).json({ error: 'Missing metadata' });
    }

    // Fetch the project's current share price from Supabase
    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .select('price_per_share, sold_shares')
      .eq('id', project_id)
      .single();

    if (projectErr || !project) {
      console.error('Project not found:', project_id, projectErr);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate shares proportionally (amounts can differ from exact share price)
    const sharesEarned = amountPaid / project.price_per_share;

    // Insert the investment record
    const { error: investErr } = await supabase.from('investments').insert({
      user_id,
      project_id,
      amount_paid: amountPaid,
      shares_count: sharesEarned,
      naboopay_transaction_id: event.id || event.transaction?.id,
      created_at: new Date().toISOString(),
    });

    if (investErr) {
      console.error('Investment insert error:', investErr);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    // Update the project's sold shares count
    await supabase
      .from('projects')
      .update({ sold_shares: (project.sold_shares || 0) + sharesEarned })
      .eq('id', project_id);

    // Update the user's total shares in their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_shares_count, total_invested')
      .eq('id', user_id)
      .single();

    await supabase
      .from('profiles')
      .upsert({
        id: user_id,
        email: user_email,
        total_shares_count: (profile?.total_shares_count || 0) + sharesEarned,
        total_invested: (profile?.total_invested || 0) + amountPaid,
        updated_at: new Date().toISOString(),
      });

    console.log(`✅ ${sharesEarned} shares attributed to user ${user_id} for project ${project_name}`);
    return res.status(200).json({ success: true, shares_attributed: sharesEarned });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
