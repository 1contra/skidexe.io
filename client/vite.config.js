import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: './src',
  plugins: [vue()],
  build: {
    outDir: '../dist',
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true
    }
  },
  publicDir: '../public',
});