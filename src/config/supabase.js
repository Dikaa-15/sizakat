let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  }

  // Lazy-load dependency so app can still run if feature is unused.
  const { createClient } = require('@supabase/supabase-js');
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

module.exports = { getSupabaseClient };
