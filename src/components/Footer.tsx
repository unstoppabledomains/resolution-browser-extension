import React from "react";
import {Box, Grid, Link} from "@mui/material";

const styles = {
  main: {
    maxHeight: "48px",
    padding: 1,
    backgroundColor: "#eef9ff",
    color: "#2d64ff",
    fontWeight: "bold",
  },
};

interface Props {}

const Footer: React.FC<Props> = ({}) => {
  return (
    <Box sx={styles.main}>
      <Grid container wrap="nowrap" spacing={1}>
        <Grid item>
          <Link href="https://unstoppabledomains.com" target="blank">
            <i className="material-icons md-24">home</i>
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Footer;
