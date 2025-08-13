import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@services': path.resolve(__dirname, 'src/services'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libs
          react: ['react', 'react-dom'],
          // Firebase SDK pieces used (keep together for caching)
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore'
          ]
        }
      }
    }
  }
});
