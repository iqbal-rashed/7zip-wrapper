import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: 'text',
      include: ['src/**/*.{js,ts}'],
      exclude: ['**/*.d.ts', '**/dist/**', '**/node_modules/**', '**/test/**'],
    },
  },
});
