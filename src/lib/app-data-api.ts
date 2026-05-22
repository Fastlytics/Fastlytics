import { request } from './api-client';

export interface SaveChartPayload {
  title: string;
  description?: string;
  chart_type: string;
  race_name?: string;
  chart_config?: Record<string, unknown>;
  folder_id?: string;
  is_public?: boolean;
}

export const trackUserActivity = async (payload: {
  session_id: string;
  event_name: string;
  event_data: Record<string, unknown>;
}): Promise<void> => {
  await request<{ ok: boolean }>('/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const joinMobileWaitlist = async (email: string): Promise<void> => {
  await request<{ ok: boolean; duplicate?: boolean }>('/api/mobile-waitlist', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const createSavedFolder = async (
  name: string
): Promise<{ id: string; name: string; cover_image_url: string | null }> => {
  return request('/api/saved/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

export const updateSavedFolder = async (
  folderId: string,
  updates: { is_public?: boolean; cover_image_url?: string | null }
): Promise<void> => {
  await request<{ ok: boolean }>(`/api/saved/folders/${encodeURIComponent(folderId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const deleteSavedFolder = async (folderId: string): Promise<void> => {
  await request<{ ok: boolean }>(`/api/saved/folders/${encodeURIComponent(folderId)}`, {
    method: 'DELETE',
  });
};

export const createSavedChart = async (payload: SaveChartPayload): Promise<unknown> => {
  return request('/api/saved/charts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateSavedChart = async (
  chartId: string,
  updates: { is_public?: boolean; folder_id?: string | null }
): Promise<void> => {
  await request<{ ok: boolean }>(`/api/saved/charts/${encodeURIComponent(chartId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const deleteSavedChart = async (chartId: string): Promise<void> => {
  await request<{ ok: boolean }>(`/api/saved/charts/${encodeURIComponent(chartId)}`, {
    method: 'DELETE',
  });
};

export const bulkDeleteSavedCharts = async (chartIds: string[]): Promise<void> => {
  await request<{ ok: boolean }>('/api/saved/charts/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ chart_ids: chartIds }),
  });
};

export const bulkMoveSavedCharts = async (chartIds: string[], folderId: string): Promise<void> => {
  await request<{ ok: boolean }>('/api/saved/charts/bulk-move', {
    method: 'POST',
    body: JSON.stringify({ chart_ids: chartIds, folder_id: folderId }),
  });
};

export const purgeAccountData = async (): Promise<void> => {
  await request<{ ok: boolean }>('/api/account/data', {
    method: 'DELETE',
  });
};

export interface McpApiKeySummary {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

export interface McpUsageLogEntry {
  tool_name: string;
  created_at: string;
}

export const listMcpKeys = async (): Promise<McpApiKeySummary[]> => {
  return request('/api/mcp/keys');
};

export const getMcpUsage = async (): Promise<{ count: number; recent: McpUsageLogEntry[] }> => {
  return request('/api/mcp/usage');
};

export const createMcpKeyRecord = async (payload: {
  name: string;
  key_hash: string;
  key_prefix: string;
}): Promise<void> => {
  await request<{ ok: boolean }>('/api/mcp/keys', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const revokeMcpKey = async (id: string): Promise<void> => {
  await request<{ ok: boolean }>(`/api/mcp/keys/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ revoked: true }),
  });
};
