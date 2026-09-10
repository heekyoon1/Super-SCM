import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from './env';

export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, key } = getPublicSupabaseConfig();
  return createBrowserClient(url, key);
}
