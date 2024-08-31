import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // or your preferred plugin

export default defineConfig({
  root: './', // Ensure this is correct or adjust it if necessary
  plugins: [vue()],
  build: {
    outDir: 'dist', // Output directory for bundled files
  },
  server: {
    port: 3000, // Adjust the port if needed
    watch: {
      usePolling: true
    }
  },
});