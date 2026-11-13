import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',                       // relative URLs: the built site works from any folder or host
  build: {
    target: 'es2022',               // top-level await in tour.js
    chunkSizeWarningLimit: 1500,    // the shared engine is one large chunk by design
    rollupOptions: {
      input: { index: resolve(import.meta.dirname, 'index.html'), tour: resolve(import.meta.dirname, 'tour.html') },
    },
  },
});
