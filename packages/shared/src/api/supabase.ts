import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  };

  return { supabase: client, getAccessToken };
}
