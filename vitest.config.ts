import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));
const sharedPackages = [
  "react",
  "react-dom",
  "@emotion/react",
  "@emotion/styled",
  "@mui/material",
  "@mui/system",
  "@mui/icons-material",
  "@mui/x-data-grid",
  "@mui/x-date-pickers",
];
const sharedPackageAliases = sharedPackages.flatMap((name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const packagePath = `${packageRoot}node_modules/${name}`;
  return [
    { find: new RegExp(`^${escapedName}$`), replacement: packagePath },
    { find: new RegExp(`^${escapedName}/(.+)$`), replacement: `${packagePath}/$1` },
  ];
});

export default defineConfig({
  resolve: {
    // Local file-linked packages can contain their own development React install.
    // Keep component tests on this workspace's renderer instance.
    dedupe: [
      "react",
      "react-dom",
      "react-hook-form",
      "@emotion/react",
      "@emotion/styled",
      "@mui/x-date-pickers",
    ],
    alias: sharedPackageAliases,
  },
  test: {
    environment: "jsdom",
    server: { deps: { inline: ["@mui/x-data-grid"] } },
    setupFiles: ["./tests/setup.ts"],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
});
