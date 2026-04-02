
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://exkofskxjvcuclyozlho.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    type_event,
    item_price,
    ref_command,
    custom_field,
    api_key_sha256,
    api_secret_sha256,
    token
  } = req.body;

  // Security Verification (HMAC or SHA256 hashes)
  // PayTech documentation says they send api_key_sha256 and api_secret_sha256
  // Or we can use hmac_compute if provided.
  
  const API_KEY = process.env.PAYTECH_API_KEY;
  const API_SECRET = process.env.PAYTECH_API_SECRET;

  const expectedKeyHash = crypto.createHash('sha256').update(API_KEY).digest('hex');
  const expectedSecretHash = crypto.createHash('sha256').update(API_SECRET).digest('hex');

  if (api_key_sha256 !== expectedKeyHash || api_secret_sha256 !== expectedSecretHash) {
    console.error('PAYTECH IPN AUTH FAILED');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle successful payment
  if (type_event === 'sale_complete') {
    let customData = {};
    try {
      customData = JSON.parse(custom_field);
    } catch (e) {
      console.error('FAILED TO PARSE CUSTOM FIELD:', custom_field);
    }

    const { userId, projectId, amount } = customData;

    try {
      // 1. Update investment status
      const { data: inv, error: invErr } = await db
        .from('investments')
        .update({ status: 'success', paytech_token: token })
        .eq('order_id', token) // Or search by ref_command if saved differently
        .select()
        .single();

      // Note: If finding by token fails because it wasn't saved yet, use ref_command
      if (invErr) {
        // Fallback or retry logic if needed
      }

      // 2. Update user profile
      const { data: profile, error: profErr } = await db
        .from('profiles')
        .select('total_shares_count, total_invested')
        .eq('id', userId)
        .single();

      if (profile) {
        const newInvested = (profile.total_invested || 0) + parseInt(amount);
        const newShares = (profile.total_shares_count || 0) + (parseInt(amount) / 10000); // Pricing model

        await db.from('profiles').update({
          total_invested: newInvested,
          total_shares_count: newShares
        }).eq('id', userId);
      }

      console.log('PAYMENT PROCESSED SUCCESSFULLY:', ref_command);
      return res.status(200).send('OK');
    } catch (err) {
      console.error('DB ERROR:', err);
      return res.status(500).json({ error: 'Database update failed' });
    }
  }

  return res.status(200).send('Event ignored');
}
