/**
 * lib/supabase-admin.ts
 * Server-only Supabase client using the service role key.
 * Bypasses RLS. Used ONLY in server-side operations (webhooks, service routes).
 * The 'server-only' package guarantees this cannot leak into client bundles.
 */
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase Service Role environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
