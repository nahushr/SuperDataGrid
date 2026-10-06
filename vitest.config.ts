import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    server: { deps: { inline: ["@mui/x-data-grid"] } },
    setupFiles: ["./tests/setup.ts"],
    css: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
