import { createSupabaseClient } from '@fastlytics/shared';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const { supabase, getAccessToken } = createSupabaseClient(supabaseUrl, supabaseAnonKey);
