import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return { url, key };
}

export function createSupabaseServerClient(): SupabaseClient {
  const { url, key } = getPublicSupabaseConfig();
  return createClient(url, key);
}
