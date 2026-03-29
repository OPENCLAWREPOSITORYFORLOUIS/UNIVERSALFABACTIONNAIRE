import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to handle Naboopay webhooks securely
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const payload = req.body;
    const orderId = payload.order_id;
    const status = payload.transaction_status; // ex: 'success', 'paid', etc.
    
    // Validate that orderId exists
    if (!orderId) return res.status(400).json({ error: 'Missing order_id' });

    // Assuming 'paid' or 'success' means successful investment
    if (status === 'success' || status === 'paid' || status === 'completed') {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // IMPORTANT: Put this secret in Vercel Environment Variables!
      
      if (!supabaseServiceKey) return res.status(500).json({ error: 'Missing Server Key' });

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 1. Fetch pending investment
      const { data: inv } = await supabase.from('investments').select('*').eq('order_id', orderId).single();
      
      if (inv && inv.status !== 'paid') {
        // 2. Mark as paid
        await supabase.from('investments').update({ status: 'paid' }).eq('order_id', orderId);
        
        // 3. Add to profile (fetch current profile)
        const { data: prof } = await supabase.from('profiles').select('total_shares_count, total_invested').eq('id', inv.user_id).single();
        if (prof) {
            await supabase.from('profiles').update({
                total_shares_count: prof.total_shares_count + inv.shares_count,
                total_invested: prof.total_invested + inv.amount_paid
            }).eq('id', inv.user_id);
        }
      }
    }

    // Always return 200 OK so Naboopay knows we received it
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}
