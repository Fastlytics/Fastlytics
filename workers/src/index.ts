export interface Env {
  FASTLYTICS_API_KEY: string;
  BACKEND_API_URL: string;
}

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
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
