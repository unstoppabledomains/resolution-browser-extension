import React from "react";
import {Box, Grid, Typography} from "@mui/material";

const styles = {
  main: {
    padding: 2,
  },
  logo: {
    width: "48px",
    borderRadius: 1,
    objectFit: "contain",
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

interface Props {}

const Header: React.FC<Props> = ({}) => (
  <Box sx={styles.main}>
    <Grid container wrap="nowrap" spacing={1}>
      <Grid item>
        <Box
          component="img"
          sx={styles.logo}
          src="icon/128.png"
          alt="Unstoppable domains logo"
        />
      </Grid>
      <Grid item xs zeroMinWidth>
        <Box fontWeight="fontWeightBold">
          <Typography noWrap variant="subtitle1" sx={styles.title1}>
            Your Portal to Decentralised web
          </Typography>
        </Box>
        <Typography noWrap variant="subtitle2" sx={styles.title2}>
          This extension opens websites on the blockchain
        </Typography>
      </Grid>
    </Grid>
  </Box>
);

export default Header;
