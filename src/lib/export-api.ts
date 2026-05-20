import { getAccessToken } from './supabase';
import type { TeamPaceGapExportPayload } from './premium-export';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_FASTLYTICS_API_KEY;

function getFilenameFromDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] || null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportTeamPaceGapPng(payload: TeamPaceGapExportPayload): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }

  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/exports/png/team-pace-gap`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = 'Export failed';
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === 'string') {
        detail = errorData.detail;
      }
    } catch {
      // Ignore malformed error bodies.
    }

    throw new Error(detail);
  }

  const blob = await response.blob();
  const filename =
    getFilenameFromDisposition(response.headers.get('Content-Disposition')) ||
    'fastlytics_pace_gap_export.png';

  downloadBlob(blob, filename);
}
