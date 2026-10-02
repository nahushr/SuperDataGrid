import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "SuperDataGrid",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      external: /^(react|react-dom|@emotion\/react|@emotion\/styled|@mui\/icons-material|@mui\/material|@mui\/x-data-grid|libphonenumber-js|xlsx)(\/|$)/,
      output: {
        exports: "named",
      },
    },
  },
});
