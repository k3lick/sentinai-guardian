import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: served from /sentinai-guardian/
  base: '/sentinai-guardian/',
  server: { port: 5173 }
});
