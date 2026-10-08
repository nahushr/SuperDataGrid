import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";

import App from "./App";
import DemoSnackbarProvider from "./components/DemoSnackbarProvider";
import "./index.css";
import "@simplishelf/opscards/style.css";
import "@simplishelf/super-data-grid/style.css";

const simpliShelfTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#267e81",
      light: "#5aaeb0",
      dark: "#1e6b6e",
      contrastText: "#ffffff",
    },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569" },
    divider: "#e2e8f0",
    action: {
      hover: "rgba(15, 23, 42, 0.04)",
      selected: "rgba(25, 118, 210, 0.08)",
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={simpliShelfTheme}>
      <CssBaseline />
      <DemoSnackbarProvider>
        <App />
      </DemoSnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);
