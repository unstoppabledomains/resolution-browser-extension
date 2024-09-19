import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconPlate from "@unstoppabledomains/ui-kit/icons/IconPlate";
import UnstoppableWalletIcon from "@unstoppabledomains/ui-kit/icons/UnstoppableWalletIcon";

const styles = {
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
    color: "#939799",
  },
};

interface Props {
  title?: string;
  subTitle?: string;
  iconPath?: string;
}

const Header: React.FC<Props> = ({
  iconPath,
  title = "Your Portal to Decentralized Web",
  subTitle = "This extension opens websites on the blockchain",
}) => (
  <Box sx={styles.main}>
    <Box sx={styles.contentContainer}>
      <Box sx={styles.logoContainer}>
        {iconPath ? (
          <Box
            component="img"
            sx={styles.logo}
            src={iconPath}
            alt="Unstoppable domains logo"
          />
        ) : (
          <IconPlate size={50} variant="info">
            <UnstoppableWalletIcon />
          </IconPlate>
        )}
      </Box>
      <Box sx={styles.descriptionContainer}>
        <Box fontWeight="fontWeightBold">
          <Typography noWrap variant="subtitle1" sx={styles.title1}>
            {title}
          </Typography>
        </Box>
        <Typography noWrap variant="subtitle2" sx={styles.title2}>
          {subTitle}
        </Typography>
      </Box>
    </Box>
    <Divider />
  </Box>
);

export default Header;
