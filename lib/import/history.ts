import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function listImportHistory() { const supabase = await createSupabaseServerClient(); return supabase.schema('core').from('upload_batch').select('*').order('uploaded_at', { ascending: false }).limit(100); }
