import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/introduce/v1/',
  build: {
    target: 'es2020',
  },
});
