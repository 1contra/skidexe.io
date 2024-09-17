import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { exec } from 'child_process';
import path from 'path';

// Define your output and obfuscation paths
const outputDir = path.resolve(__dirname, '../dist/assets');
const obfuscationDir = path.resolve(__dirname, '../dist/assets-obfuscated');

export default defineConfig({
  root: './public',
  plugins: [vue()],
  build: {
    outDir: '../dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true
    }
  },
  // Obfuscate the built JS files after build
  async buildEnd() {
    // Ensure the output directory exists
    exec(`mkdir -p ${obfuscationDir}`, (err) => {
      if (err) {
        console.error(`Error creating obfuscation directory: ${err}`);
        return;
      }

      // Run the obfuscation command
      exec(`npx javascript-obfuscator ${outputDir} --output ${obfuscationDir} --compact true --controlFlowFlattening true --deadCodeInjection true --debugProtection true --stringArray true --stringArrayEncoding rc4 --splitStrings true --transformObjectKeys true --rotateStringArray true`, (err, stdout, stderr) => {
        if (err) {
          console.error(`Error during obfuscation: ${stderr}`);
        } else {
          console.log(`Obfuscation complete: ${stdout}`);
        }
      });
    });
  },
});