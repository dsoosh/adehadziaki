import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const executablePath = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    permissions: ["camera", "microphone"],
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], ...(executablePath ? { launchOptions: { executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } } : {}) } }],
  webServer: {
    command: `PORT=${PORT} bash scripts/start-standalone.sh`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`, ADMIN_EMAILS: "admin.e2e@test.pl" },
  },
});
