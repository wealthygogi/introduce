import { defineConfig } from '@playwright/test';

const PORT = 5199;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}/introduce`,
    acceptDownloads: true,
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  webServer: {
    // CI 는 빌드 산출물(dist)을 검사, 로컬은 dev 서버로 빠른 반복
    command: process.env.CI ? `npx vite preview --port ${PORT} --strictPort` : `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/introduce/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
