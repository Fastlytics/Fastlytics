# Fastlytics API Proxy - Cloudflare Worker

Secure API key by proxying frontend requests through Cloudflare Workers.

## Architecture

```
Frontend (no API keys) → Cloudflare Worker (injects X-API-Key) → Backend API
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
# Opens browser for OAuth authentication
```

### 3. Set API Key Secret

```bash
npx wrangler secret put FASTLYTICS_API_KEY
# Paste your backend API key when prompted
# This is stored securely in Cloudflare, not in code
```

### 4. Deploy Worker

```bash
npm run deploy
```

### 5. Configure DNS

Add CNAME record for your domain:

```
Type: CNAME
Name: api
Target: <your-worker-url>.workers.dev
```

Or configure via `wrangler.toml` routes to use `api.fastlytics.app`.

## Files

- `src/index.ts` - Main proxy logic
- `wrangler.toml` - Worker configuration
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies

## Environment Variables

- `FASTLYTICS_API_KEY` - Secret (set via `wrangler secret put`)
- `BACKEND_API_URL` - `https://data.fastlytics.app`

## Development

```bash
# Local development
npm run dev

# View logs
npm run tail
```
