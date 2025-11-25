import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Allows access on any network interface
    port: 8080,  // Change to the port you want
  },
  preview: {
    allowedHosts: ['fastlytics.app'], // Allow access from these hosts
  },
  plugins: [
    react(),
  ].
  filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
