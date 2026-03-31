import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://exkofskxjvcuclyozlho.supabase.co';
const SUPABASE_ANON = 'sb_publishable_zWiaMU_WeuAbLjr1cHcgDg_wr79HXzE';
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

async function listUsers() {
  const { data, error } = await db.from('profiles').select('id, full_name, email, phone, dividends_balance').limit(10);
  if (error) {
    console.error('Error listing users:', error.message);
  } else {
    console.log('Users found:', JSON.stringify(data, null, 2));
  }
}

listUsers();
