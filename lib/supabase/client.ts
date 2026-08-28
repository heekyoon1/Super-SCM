import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return { url, key };
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, key } = getPublicSupabaseConfig();
  return createBrowserClient(url, key);
}
