import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://exkofskxjvcuclyozlho.supabase.co';
const SUPABASE_ANON = 'sb_publishable_zWiaMU_WeuAbLjr1cHcgDg_wr79HXzE';
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

async function checkUser() {
  const { data, error } = await db.from('profiles').select('id, full_name, email, dividends_balance').eq('email', 'agrilenspaid@proton.me').single();
  if (error) {
    console.error('Error fetching user:', error.message);
  } else {
    console.log('User found:', JSON.stringify(data, null, 2));
    
    // Try to update with anon key (might fail but worth a try)
    const { error: updateError } = await db.from('profiles').update({ dividends_balance: (data.dividends_balance || 0) + 1000000 }).eq('id', data.id);
    if (updateError) {
      console.error('Update failed with anon key (RLS likely on):', updateError.message);
    } else {
      console.log('Successfully updated balance by 1,000,000!');
    }
  }
}

checkUser();
