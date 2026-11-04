import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  base: './',
  preview: { allowedHosts: ['arsenal.dev.br'] },
  test: { environment: 'node' },
});
