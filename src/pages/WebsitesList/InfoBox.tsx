import {Box, Link, Typography} from "@mui/material";
import React from "react";

const styles = {
  infoTitle: {
    paddingBottom: "8px",
    paddingLeft: "4px",
  },
  infoBody: {
    height: "144px",
    marginBottom: "8px",
  },
  browserBox: {
    display: "flex",
    borderRadius: "6px",
    border: "solid 1px rgba(45, 122, 255, 0.33)",
    padding: "12px",
    marginTop: "8px",
  },
  browserLogo: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    marginRight: "12px",
  },
  link: {
    color: "#0e4dff",
    textDecoration: "none",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    marginLeft: "8px",
    marginBottom: "8px",
  },
  infoBox: {
    color: "#080f23",
    backgroundColor: "#e6f6ff",
    alignSelf: "center",
    padding: "4px",
  },
};

interface Props {}
const InfoBox: React.FC<Props> = () => {
  return (
    <Box sx={styles.info}>
      <Box sx={styles.infoBox}>
        <Typography variant="h5" sx={styles.infoTitle}>
          What is a blockchain domain?
        </Typography>
        <iframe
          width="460"
          height="315"
          src="https://www.youtube.com/embed/Zm6uZzZwLSg"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </Box>
      <Link href="https://unstoppabledomains.com/browser" sx={styles.link}>
        <Box sx={styles.browserBox}>
          <Box component="img" sx={styles.browserLogo} src="icon/browser.svg" />
          <Typography variant="h4" color="primary">
            Install Unstoppable Browser
          </Typography>
        </Box>
      </Link>
    </Box>
  );
};
export default InfoBox;
