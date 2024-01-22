import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
