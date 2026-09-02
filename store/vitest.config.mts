import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    unstubEnvs: true,
    alias: {
      'next/cache': path.resolve(import.meta.dirname, 'src/test/next-cache-stub.ts'),
      'server-only': path.resolve(import.meta.dirname, 'src/test/server-only-stub.ts'),
    },
  },
});
