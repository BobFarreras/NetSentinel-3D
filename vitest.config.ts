// vite.config.ts
import { configDefaults, defineConfig } from 'vitest/config'; // 👈 AQUEST ÉS EL TRUC (vitest/config en lloc de vite)
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
