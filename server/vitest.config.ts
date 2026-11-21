import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        env: { ANSWER_SECONDS: "2" },
        testTimeout: 10_000,
    },
});