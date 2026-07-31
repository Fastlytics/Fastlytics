import { supabase } from './supabase';

export interface FavoritesProfile {
  id: string;
  favorite_driver: string | null;
  favorite_team: string | null;
}

export interface FavoritesUpdate {
  favorite_driver?: string | null;
  favorite_team?: string | null;
}

export async function fetchMyProfile(userId: string): Promise<FavoritesProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, favorite_driver, favorite_team')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateMyFavorites(userId: string, updates: FavoritesUpdate): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' });

  if (error) {
    throw new Error(error.message);
  }
}
