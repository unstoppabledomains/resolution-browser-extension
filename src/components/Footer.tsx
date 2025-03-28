import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import React from "react";
import {useNavigate} from "react-router-dom";

import {
  getWalletPreferences,
  setWalletPreferences,
} from "../lib/wallet/preferences";

const styles = {
  main: {
    backgroundColor: "#eef9ff",
    color: "#2d64ff",
    fontWeight: "bold",
  },
  title: {
    fontWeight: "bold",
  },
  icon: {
    color: "#2d64ff",
  },
};

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleEnableWallet = async () => {
    // update preferences
    const preferences = await getWalletPreferences();
    preferences.WalletEnabled = true;
    preferences.DefaultView = "wallet";
    await setWalletPreferences(preferences);

    // navigate to wallet
    navigate("/wallet");
  };

  const handleOpenWebsite = () => {
    window.open("https://unstoppabledomains.com", "_blank");
  };

  return (
    <Box sx={styles.main}>
      <Grid container wrap="nowrap">
        <Grid item xs zeroMinWidth>
          <Button onClick={handleEnableWallet} variant="text" size="small">
            Enable wallet
          </Button>
        </Grid>
        <Grid item>
          <IconButton onClick={handleOpenWebsite}>
            <HomeIcon sx={styles.icon} />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Footer;
