import { defineConfig, devices } from '@playwright/test';

/**
 * One suite, every host. Point ARMATURE_HOST_URL at a running host (React
 * `vite preview`, Angular `ng serve`, and later Lit, Svelte, vanilla); the
 * tests use only roles and accessible names, so the same test proves the
 * same behavior on each. Backend calls are stubbed per test (see
 * support/backend-stub.ts), so neither armature-ms nor Ollama is needed.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.ARMATURE_HOST_URL ?? 'http://localhost:4173',
    viewport: { width: 1400, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } }],
});
