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

function normalizeExportError(responseText: string, status: number): string | null {
  const trimmed = responseText.trim();
  if (!trimmed) return null;

  if (/<!DOCTYPE html>/i.test(trimmed) || /<html/i.test(trimmed)) {
    if (/Error code 502/i.test(trimmed) || /Bad gateway/i.test(trimmed)) {
      return `Export backend unavailable right now (HTTP ${status})`;
    }

    if (/Error code 522/i.test(trimmed) || /Connection timed out/i.test(trimmed)) {
      return `Export backend timed out (HTTP ${status})`;
    }

    return `Export request failed upstream (HTTP ${status})`;
  }

  return trimmed;
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
    let detail = `Export failed (HTTP ${response.status})`;

    try {
      const responseText = await response.text();
      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('application/json')) {
        const errorData = JSON.parse(responseText) as { detail?: unknown; message?: unknown };

        if (typeof errorData.detail === 'string') {
          detail = errorData.detail;
        } else if (typeof errorData.message === 'string') {
          detail = errorData.message;
        }
      } else {
        const normalized = normalizeExportError(responseText, response.status);
        if (normalized) {
          detail = normalized;
        }
      }
    } catch {
      // Keep the status-based fallback message.
    }

    throw new Error(`${detail} (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const filename =
    getFilenameFromDisposition(response.headers.get('Content-Disposition')) ||
    'fastlytics_pace_gap_export.png';

  downloadBlob(blob, filename);
}
