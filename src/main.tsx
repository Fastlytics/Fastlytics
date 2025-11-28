import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById("root")!).render(<App />);
