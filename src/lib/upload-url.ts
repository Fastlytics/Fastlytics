const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.fastlytics.app').replace(
  /\/$/,
  ''
);

export function resolveUploadUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url, API_BASE_URL);
    if (!parsed.pathname.startsWith('/api/uploads/')) {
      return url;
    }

    return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}
