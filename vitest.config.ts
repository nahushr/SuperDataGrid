import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    server: { deps: { inline: ["@mui/x-data-grid"] } },
    setupFiles: ["./tests/setup.ts"],
    css: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
      reportsDirectory: "./coverage",
      thresholds: { statements: 80, lines: 80 },
    },
  },
});
