import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    treeshake: true,
    sourcemap: false,
    clean: true,
    minify: true,
    shims: true,
    target: 'node18',
  },
  // CLI
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    sourcemap: false,
    clean: true,
    minify: true,
    shims: true,
    target: 'node18',

    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Postinstall script
  {
    entry: ['src/scripts/postinstall.ts'],
    format: ['cjs'],
    sourcemap: false,
    clean: true,
    minify: true,
    shims: true,
    target: 'node18',
  },
]);
