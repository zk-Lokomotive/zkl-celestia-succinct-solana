import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { Buffer } from 'buffer';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      buffer: 'buffer/'
    }
  },
  define: {
    global: {},
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});