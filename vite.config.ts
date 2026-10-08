import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "SuperDataGrid",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
      cssFileName: "style",
    },
    rollupOptions: {
      external: /^(react|react-dom|react-hook-form|@emotion\/react|@emotion\/styled|@mui\/icons-material|@mui\/material|@mui\/x-data-grid|@mui\/x-date-pickers|@simplishelf\/(opscards|polyform)|libphonenumber-js|write-excel-file)(\/|$)/,
      output: {
        exports: "named",
      },
    },
  },
});
