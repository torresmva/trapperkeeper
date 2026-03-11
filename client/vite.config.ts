import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mermaid: ['mermaid'],
          codemirror: [
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/lang-markdown',
            '@codemirror/language',
            '@codemirror/commands',
            '@codemirror/search',
            'codemirror',
          ],
          markdown: ['react-markdown', 'remark-gfm', 'rehype-highlight', 'rehype-raw', 'remark-math', 'rehype-katex'],
        },
      },
    },
  },
});
