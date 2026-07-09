"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6750A4",
      light: "#EADDFF",
      dark: "#4F378B",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#625B71",
      light: "#E8DEF8",
      dark: "#49454F",
    },
    success: {
      main: "#386A20",
      light: "#C4E8B4",
    },
    warning: {
      main: "#7D5700",
      light: "#FFE08A",
    },
    error: {
      main: "#B3261E",
      light: "#F9DEDC",
    },
    background: {
      default: "#FFFBFE",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 100,
          fontWeight: 600,
          padding: "10px 24px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});
