import type {Theme} from "@mui/material/styles";

import {makeStyles} from "@unstoppabledomains/ui-kit/styles";

export const useExtensionStyles = makeStyles()((theme: Theme) => ({
  container: {
    width: "400px",
    height: "600px",
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: theme.palette.common.white,
    borderRadius: 0,
  },
  walletContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
  },
}));
