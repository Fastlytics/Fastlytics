export interface Env {
  FASTLYTICS_API_KEY: string;
  BACKEND_API_URL: string;
}

const ALLOWED_ORIGINS = [
  'https://fastlytics.app',
  'https://beta.fastlytics.app',
  'https://www.fastlytics.app',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(
    (allowed) => origin === allowed || origin.endsWith('.fastlytics.app')
  );
}

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin)) {
        return new Response('Forbidden', { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Allow sitemap.xml without origin check (for search engine crawlers)
    if (url.pathname === '/sitemap.xml') {
      try {
        const backendUrl = `${env.BACKEND_API_URL}/sitemap.xml`;
        const backendResponse = await fetch(backendUrl, {
          method: 'GET',
          headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Worker',
          },
        });

        return new Response(backendResponse.body, {
          status: backendResponse.status,
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } catch (error) {
        console.error('Sitemap proxy error:', error);
        return new Response('Sitemap unavailable', { status: 502 });
      }
    }

    const refererOrigin = referer ? new URL(referer).origin : null;
    if (!isAllowedOrigin(origin) && !isAllowedOrigin(refererOrigin)) {
      return new Response(JSON.stringify({ detail: 'Forbidden: Invalid origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    const backendUrl = `${env.BACKEND_API_URL}${url.pathname}${url.search}`;

    try {
      const headers = new Headers(request.headers);
      headers.set('X-API-Key', env.FASTLYTICS_API_KEY);

      const backendResponse = await fetch(backendUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'follow',
      });

      const responseHeaders = new Headers(backendResponse.headers);
      Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      if (backendResponse.headers.get('Content-Encoding')) {
        responseHeaders.set('Content-Encoding', backendResponse.headers.get('Content-Encoding')!);
      }

      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ detail: 'Proxy error occurred' }), {
        status: 500,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
