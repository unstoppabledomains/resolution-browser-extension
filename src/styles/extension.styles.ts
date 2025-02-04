import type {Theme} from "@mui/material/styles";
import {alpha} from "@mui/system/colorManipulator";

import {makeStyles} from "@unstoppabledomains/ui-kit/styles";

export const useExtensionStyles = makeStyles()((theme: Theme) => ({
  container: {
    minWidth: "400px",
    minHeight: "600px",
    width: "calc(100vw)",
    height: "calc(100vh)",
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: theme.palette.background.paper,
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
    borderRadius: 0,
    overflow: "hidden",
  },
  preferenceContainer: {
    height: "calc(100vh - 100px)",
    overflow: "auto",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    width: "100%",
  },
  footerContainer: {
    marginBottom: theme.spacing(-2),
  },
  messageContainer: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.neutralShades[theme.palette.mode === "light" ? 400 : 800]}`,
    borderRadius: theme.shape.borderRadius,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginLeft: "1px",
    marginRight: "1px",
    fontFamily: "monospace",
    fontSize: "12px",
    wordWrap: "break-word",
    maxWidth: "500px",
    textAlign: "center",
    width: "100%",
    overflowWrap: "break-word",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "calc(100vw - 50px)",
      maxHeight: "100px",
      overflow: "auto",
    },
  },
  connectContainer: {
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    width: "100%",
  },
  connectContainerTitle: {
    textAlign: "left",
    marginBottom: theme.spacing(1),
  },
  connectContainerValue: {
    textAlign: "right",
    fontWeight: "bold",
    marginBottom: theme.spacing(1),
  },
  connectContainerIcon: {
    width: "20px",
    height: "20px",
    marginRight: theme.spacing(1),
  },
  fullHeightCentered: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
  },
  mainScreenContainer: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  settingInfoContainer: {
    display: "flex",
    marginTop: theme.spacing(1),
    textAlign: "left",
    justifyContent: "left",
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
    color: theme.palette.getContrastText(theme.palette.background.paper),
  },
  updatedContentContainer: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    marginTop: theme.spacing(2),
    width: "100%",
  },
  loadingSpinner: {
    width: "75px",
    height: "75px",
  },
  button: {
    marginTop: theme.spacing(1),
  },
  actionButton: {
    color: theme.palette.common.white,
    marginLeft: theme.spacing(1),
  },
  testNetContainerLeft: {
    position: "absolute",
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
  testNetContainerRight: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
  },
  link: {
    color:
      theme.palette.mode === "light"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));
