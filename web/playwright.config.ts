import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    workers: process.env.CI ? 1 : undefined,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
    use: { trace: "retain-on-failure" },
    webServer: [
        {
            // the Socket.io server
            command: "npx tsx index.ts",
            cwd: "../server",
            port: 4000,
            env: { PORT: "4000" },
            reuseExistingServer: !process.env.CI,
        },
        {
            // the Next.js client: a production build in CI, the dev server locally
            command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
            url: "http://localhost:3000",
            timeout: 180_000,
            reuseExistingServer: !process.env.CI,
        },
    ],
});