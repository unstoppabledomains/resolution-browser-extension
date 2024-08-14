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
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    width: "100%",
  },
  walletContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
  },
  walletIcon: {
    width: "75px",
    height: "75px",
    padding: theme.spacing(1),
    backgroundColor: theme.palette.neutralShades[100],
  },
}));
