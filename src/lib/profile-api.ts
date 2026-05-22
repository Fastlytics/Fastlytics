import { request } from './api-client';

export interface ProfilePatchPayload {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  favorite_driver?: string | null;
  favorite_team?: string | null;
  onboarding_completed?: boolean;
  updated_at?: string | null;
  is_public?: boolean;
  show_favorites?: boolean;
  show_comments?: boolean;
  show_saved_charts?: boolean;
}

export const updateMyProfile = async (updates: ProfilePatchPayload): Promise<void> => {
  await request<{ ok: boolean }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const deleteMyProfile = async (): Promise<void> => {
  await request<{ ok: boolean }>('/api/profile', {
    method: 'DELETE',
  });
};
