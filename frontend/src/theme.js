import { createTheme } from "@mui/material";

// Shared brand gradient — used for the primary CTA and the sidebar brand icon.
export const gradientPrimary = "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)";

const sharedTypography = {
  fontFamily: [
    "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto",
    '"Helvetica Neue"', "Arial", "sans-serif",
  ].join(","),
};

const cardComponentOverrides = (mode) => ({
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
        border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
        boxShadow: "none",
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      outlined: {
        borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 8,
      },
    },
  },
});

const lightTheme = createTheme({
  shape: { borderRadius: 12 },
  typography: sharedTypography,
  palette: {
    mode: "light",
    primary: { main: "#3B82F6" },
    secondary: { main: "#8B5CF6" },
    success: { main: "#16A34A" },
    error: { main: "#DC2626" },
    background: {
      default: "#F4F6FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
    divider: "rgba(15,23,42,0.08)",
  },
  components: cardComponentOverrides("light"),
});

const darkTheme = createTheme({
  shape: { borderRadius: 12 },
  typography: sharedTypography,
  palette: {
    mode: "dark",
    primary: { main: "#60A5FA" },
    secondary: { main: "#A78BFA" },
    success: { main: "#22C55E" },
    error: { main: "#F87171" },
    background: {
      default: "#0B0F1A",
      paper: "#131A2C",
    },
    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
    },
    divider: "rgba(255,255,255,0.08)",
  },
  components: cardComponentOverrides("dark"),
});

export { lightTheme, darkTheme };
