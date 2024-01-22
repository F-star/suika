import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 6167,
  },
  build: {
    outDir: 'build',
    cssCodeSplit: false,
  },
});
