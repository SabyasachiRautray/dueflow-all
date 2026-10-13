import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the Express backend (APP_PORT, default 5000),
// so the app works with no .env. Set VITE_API_URL to point elsewhere in production.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
