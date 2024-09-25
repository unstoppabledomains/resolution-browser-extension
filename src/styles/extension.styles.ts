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
