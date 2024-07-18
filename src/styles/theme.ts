import {createTheme} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    primaryShades: PaletteOptions["primary"];
    neutralShades: Palette["primary"];
  }

  interface PaletteOptions {
    primaryShades?: PaletteOptions["primary"];
    neutralShades?: PaletteOptions["primary"];
  }
}

const theme = createTheme();

const customTheme = createTheme({
  ...theme,
  palette: {
    primary: {
      main: "#0e67fe",
      light: "#ffffff",
    },
    background: {
      default: "#f5f5f5",
    },
    primaryShades: {
      100: "#eeeeff",
      900: "#00000033",
    },
    neutralShades: {
      50: "#f0f0f0",
      100: "#d9d9d9",
      200: "#bfbfbf",
      300: "#a6a6a6",
      400: "#8c8c8c",
      500: "#737373",
      600: "#595959",
      700: "#404040",
      800: "#262626",
      900: "#0d0d0d",
    },
  },
  spacing: 8,
  typography: {
    h1: {
      fontSize: 36,
      lineHeight: "64px",
      fontFamily: "'Helvetica Neue', sans-serif",
      fontWeight: 900,
    },
  },
});

export default customTheme;
