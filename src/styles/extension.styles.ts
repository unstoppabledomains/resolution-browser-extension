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
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(242,242,242,1) 100%)",
    borderRadius: 0,
  },
  preferenceContainer: {
    height: "500px",
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
    backgroundColor: theme.palette.neutralShades[100],
    border: `1px solid ${theme.palette.neutralShades[400]}`,
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
    backgroundColor: theme.palette.neutralShades[100],
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
    color: theme.palette.common.black,
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
    color: "white",
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
}));
