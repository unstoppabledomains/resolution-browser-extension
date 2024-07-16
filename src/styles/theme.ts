import {createTheme} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    primaryShades: PaletteOptions["primary"];
  }

  interface PaletteOptions {
    primaryShades?: PaletteOptions["primary"];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#ffffff",
    },
    primaryShades: {
      100: "#eeeeff",
      900: "#00000033",
    },
  },
  spacing: 8,
});

export default theme;
