import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import React from "react";

import {WalletIcon} from "@unstoppabledomains/ui-components";
import IconPlate from "@unstoppabledomains/ui-kit/icons/IconPlate";
import {makeStyles} from "@unstoppabledomains/ui-kit/styles";

const useStyles = makeStyles()((theme: Theme) => ({
  main: {
    padding: 2,
    marginTop: "-16px",
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    width: "400px",
  },
  contentContainer: {
    display: "flex",
    marginBottom: "8px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "8px",
  },
  descriptionContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  logo: {
    width: "50px",
    height: "50px",
  },
  title1: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  title2: {
    fontSize: "13px",
    color: theme.palette.getContrastText(theme.palette.background.paper),
  },
}));

interface Props {
  title?: string;
  subTitle?: string;
  iconPath?: string;
}

const Header: React.FC<Props> = ({
  iconPath,
  title = "Your Portal to Decentralized Web",
  subTitle = "This extension opens websites on the blockchain",
}) => {
  const {classes} = useStyles();

  return (
    <Box className={classes.main}>
      <Box className={classes.contentContainer}>
        <Box className={classes.logoContainer}>
          {iconPath ? (
            <Box
              component="img"
              className={classes.logo}
              src={iconPath}
              alt="Unstoppable domains logo"
            />
          ) : (
            <IconPlate size={50} variant="info">
              <WalletIcon />
            </IconPlate>
          )}
        </Box>
        <Box className={classes.descriptionContainer}>
          <Box fontWeight="fontWeightBold">
            <Typography noWrap variant="subtitle1" className={classes.title1}>
              {title}
            </Typography>
          </Box>
          <Typography noWrap variant="subtitle2" className={classes.title2}>
            {subTitle}
          </Typography>
        </Box>
      </Box>
      <Divider />
    </Box>
  );
};

export default Header;
