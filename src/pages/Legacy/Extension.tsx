import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MainScreen from "./MainScreen";
import {Box, Paper} from "@mui/material";
import {useExtensionStyles} from "../../styles/extension.styles";

const styles = {
  topLayout: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  middleLayout: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
};

interface Props {}

const Extension: React.FC<Props> = () => {
  const {classes} = useExtensionStyles();

  return (
    <Paper className={classes.container}>
      <Box sx={styles.topLayout}>
        <Box sx={styles.middleLayout}>
          <Header iconPath="icon/browser.svg" />
          <Box className={classes.mainScreenContainer}>
            <MainScreen />
          </Box>
        </Box>
        <Box className={classes.footerContainer}>
          <Footer />
        </Box>
      </Box>
    </Paper>
  );
};

export default Extension;
