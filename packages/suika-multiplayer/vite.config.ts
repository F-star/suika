import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), checker({ typescript: true })],
  base: './',
  server: {
    port: 6168,
    host: true,
    proxy: {
      '/api': 'http://localhost:5356',
    },
  },
  build: {
    outDir: 'build',
    cssCodeSplit: false,
  },
});
