import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import { PostHogProvider } from 'posthog-js/react';
import App from './App.tsx'
import './index.css'

const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

if (umamiWebsiteId) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = "https://analytics.subhashh.tech/script.js";
    script.setAttribute('data-website-id', umamiWebsiteId);
    document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <PostHogProvider
            apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
            options={{
                api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
                defaults: '2025-05-24',
                capture_exceptions: true,
                debug: import.meta.env.MODE === "development",
            }}
        >
            <HelmetProvider>
                <App />
            </HelmetProvider>
        </PostHogProvider>
    </StrictMode>
);