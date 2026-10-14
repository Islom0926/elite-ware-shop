import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Telegram serves the Mini App from an arbitrary path; relative base keeps
  // asset URLs correct wherever it is hosted.
  base: './',
  server: {
    host: true,
    port: 5173,
    // Allows access through a tunnel host (e.g. ngrok/localtunnel/cloudflared) for
    // testing the Mini App inside Telegram, which requires an HTTPS origin.
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
