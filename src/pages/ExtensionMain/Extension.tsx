import React from "react";
import Header from "../../components/Common/Header";
import Footer from "../../components/Common/Footer";
import MainScreen from "./MainScreen";
import {Box, Divider, Paper} from "@mui/material";

const styles = {
  root: {
    width: "400px",
    borderRadius: 0,
  },
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

const Extension: React.FC<Props> = () => (
  <Paper sx={styles.root}>
    <Box sx={styles.topLayout}>
      <Box sx={styles.middleLayout}>
        <Header />
        <Divider />
        <MainScreen />
      </Box>
      <Footer />
    </Box>
  </Paper>
);

export default Extension;
